// backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// In-memory store for user-reported incidents (demo only)
const REPORTED_INCIDENTS = []; // { id, latitude, longitude, category, description, reporter, createdAt }

const TOMTOM_KEY = process.env.TOMTOM_API_KEY;
const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY || null;

/**
 * Utility: Convert TomTom route → GeoJSON LineString
 */
function toGeoJSON(points) {
  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: points.map((p) => [p.longitude, p.latitude]),
    },
  };
}

/**
 * Utility: Safety scoring (simple placeholder)
 * You can later plug in ML / real crime + risk model here.
 */
function computeSafetyScore(routePoints) {
  if (!routePoints || routePoints.length === 0) return 50;

  // Dummy scoring – later: use crime, lighting, time-of-day, etc.
  const base = 90;
  const nightPenalty = 10; // pretend some segments are low-light
  const junctionPenalty = 8; // pretend a few crowded junctions

  const score = base - nightPenalty - junctionPenalty;
  return Math.max(0, Math.min(100, score));
}

/* ------------------------------------------------------------------
 *  PHASE 1: ROUTE ENDPOINT  (Fastest + Safest)
 *  ---------------------------------------------------------------- */
app.post("/route", async (req, res) => {
  try {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ message: "Invalid request" });
    }

    if (!TOMTOM_KEY) {
      return res
        .status(500)
        .json({ message: "Missing TOMTOM_API_KEY in backend .env" });
    }

    // 1) FASTEST route (TomTom, traffic = ON)
    const fastestURL = `https://api.tomtom.com/routing/1/calculateRoute/${origin.lat},${origin.lon}:${destination.lat},${destination.lon}/json?key=${TOMTOM_KEY}&routeType=fastest&traffic=true`;

    const fastestRes = await axios.get(fastestURL);
    const fastestRoute = fastestRes.data.routes?.[0];
    const fastestLeg = fastestRoute?.legs?.[0];

    if (!fastestLeg) {
      return res.status(500).json({ message: "Fastest route not found" });
    }

    const fastestPoints = fastestLeg.points || [];
    const fastestGeoJSON = toGeoJSON(fastestPoints);

    const fastestTime =
      (fastestRoute.summary.travelTimeInSeconds || 0) / 60; // mins
    const fastestDistance =
      (fastestRoute.summary.lengthInMeters || 0) / 1000; // km

    // 2) SAFEST route (for now: TomTom shortest, traffic = OFF)
    const safestURL = `https://api.tomtom.com/routing/1/calculateRoute/${origin.lat},${origin.lon}:${destination.lat},${destination.lon}/json?key=${TOMTOM_KEY}&routeType=shortest&traffic=false`;

    const safestRes = await axios.get(safestURL);
    const safestRoute = safestRes.data.routes?.[0];
    const safestLeg = safestRoute?.legs?.[0];

    if (!safestLeg) {
      return res.status(500).json({ message: "Safest route not found" });
    }

    const safestPoints = safestLeg.points || [];
    const safestGeoJSON = toGeoJSON(safestPoints);

    const safestTime =
      (safestRoute.summary.travelTimeInSeconds || 0) / 60; // mins
    const safestDistance =
      (safestRoute.summary.lengthInMeters || 0) / 1000; // km

    // Helper: extract textual instructions from TomTom route if available
    function extractInstructions(route) {
      try {
        const leg = route?.legs?.[0];
        if (!leg) return [];

        // guidance.entries (TomTom guidance format)
        if (leg.guidance && Array.isArray(leg.guidance.entries)) {
          return leg.guidance.entries.map((e) => ({
            text: e.instruction || e.label || e.text || "",
            distance: e.distanceInMeters ?? e.lengthInMeters ?? null,
            travelTime: e.travelTimeInSeconds ?? null,
          }));
        }

        // older / alternative fields
        if (Array.isArray(leg.instructions)) {
          return leg.instructions.map((i) => ({
            text: i.text || i.formattedText || i.label || "",
            distance: i.lengthInMeters ?? null,
            travelTime: i.travelTimeInSeconds ?? null,
          }));
        }

        if (Array.isArray(leg.maneuvers)) {
          return leg.maneuvers.map((m) => ({
            text: m.instruction || m.text || m.label || "",
            distance: m.lengthInMeters ?? null,
            travelTime: m.travelTimeInSeconds ?? null,
          }));
        }

        return [];
      } catch (e) {
        return [];
      }
    }

    // Safety score (will be improved in later phases)
    const safeScore = computeSafetyScore(safestPoints);

    const warnings = [
      "Low-light area detected",
      "Crowded junction ahead",
    ];

    // Final response in the exact shape your frontend expects
    return res.json({
      fastest: {
        geojson: fastestGeoJSON,
        instructions: extractInstructions(fastestRoute),
        travelTime: Number(fastestTime.toFixed(1)),
        distance: Number(fastestDistance.toFixed(1)),
        warnings: [],
      },
      safest: {
        geojson: safestGeoJSON,
        instructions: extractInstructions(safestRoute),
        safeScore,
        travelTime: Number(safestTime.toFixed(1)),
        distance: Number(safestDistance.toFixed(1)),
        warnings,
      },
    });
  } catch (err) {
    console.error("❌ /route BACKEND ERROR:", err?.response?.data || err);
    res.status(500).json({ message: "Route calculation failed" });
  }
});

/* ------------------------------------------------------------------
 *  PHASE 2: INCIDENTS ENDPOINT  (TomTom Traffic)
 *  ---------------------------------------------------------------- */
app.get("/incidents", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    // accept both `lon` and `lng` query param names (frontend may send `lng`)
    const lon = parseFloat(req.query.lon ?? req.query.lng);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res
        .status(400)
        .json({ message: "lat and lon (or lng) query params are required" });
    }

    if (!TOMTOM_KEY) {
      return res
        .status(500)
        .json({ message: "Missing TOMTOM_API_KEY in backend .env" });
    }

    // Build a bounding box around user. Allow frontend to request larger area
    // by passing `radiusKm` (approximate). Default to ~33km (~0.3 degrees).
    // We convert km -> degrees (lat) using approx 1 deg = 111 km and adjust
    // lon by cos(lat) to be slightly more accurate.
    let radiusKm = parseFloat(req.query.radiusKm ?? req.query.radius ?? "");
    if (!Number.isFinite(radiusKm) || Number.isNaN(radiusKm)) {
      // default radiusKm ~ 33km -> delta degrees ~ 0.3
      radiusKm = 33; // a reasonable default for city-level fetch
    }
    // cap radius to avoid extremely large bbox or TomTom limits
    const MAX_RADIUS_KM = 80;
    const MIN_RADIUS_KM = 1;
    if (radiusKm > MAX_RADIUS_KM) radiusKm = MAX_RADIUS_KM;
    if (radiusKm < MIN_RADIUS_KM) radiusKm = MIN_RADIUS_KM;

    const degPerKm = 1 / 111; // approx degrees latitude per km
    const deltaLat = radiusKm * degPerKm;
    // adjust lon by latitude
    const latRad = (lat * Math.PI) / 180;
    const degPerKmLon = degPerKm / Math.max(0.0001, Math.cos(latRad));
    const deltaLon = radiusKm * degPerKmLon;

    const minLat = lat - deltaLat;
    const maxLat = lat + deltaLat;
    const minLon = lon - deltaLon;
    const maxLon = lon + deltaLon;

    //const trafficUrl = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${TOMTOM_KEY}&bbox=${minLng},${minLat},${maxLng},${maxLat}&fields=incidents&language=en-GB`;
    // Remove invalid categoryFilter value (-1) — TomTom rejects it. Request without filter.
    const trafficUrl = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${TOMTOM_KEY}&bbox=${minLon},${minLat},${maxLon},${maxLat}&language=en-GB`;
    console.log(`TomTom incidents request for bbox ${minLon},${minLat},${maxLon},${maxLat} (radiusKm=${radiusKm})`);

    let trafficIncidentsRaw = [];
    try {
      const trafficRes = await axios.get(trafficUrl);
      trafficIncidentsRaw = trafficRes.data.incidents || [];
    } catch (err) {
      console.error("❌ TomTom incidents fetch error:", err?.response?.data || err);
      // Fall back to empty list instead of failing the whole endpoint
      trafficIncidentsRaw = [];
    }

    // Only include incidents that have a valid center lat/lon
    const traffic = (trafficIncidentsRaw || [])
      .map((inc) => {
        const lat = inc.geometry?.center?.lat;
        const lon = inc.geometry?.center?.lon;
        if (typeof lat !== "number" || typeof lon !== "number") return null;

        return {
          id:
            inc.id ||
            inc.incidentId ||
            `${lat},${lon}-${Math.random().toString(36).slice(2,8)}`,
          latitude: Number(lat),
          longitude: Number(lon),
          type: inc.properties?.iconCategory ?? "Incident",
          description: inc.properties?.description ?? "No description",
          severity: inc.properties?.magnitudeOfDelay ?? null,
          startTime: inc.properties?.startTime ?? null,
          endTime: inc.properties?.endTime ?? null,
        };
      })
      .filter(Boolean);

    // Include any user-reported incidents from our in-memory store that fall
    // within the bounding box we computed above.
    const reported = REPORTED_INCIDENTS.filter((r) => {
      return (
        Number(r.latitude) >= minLat &&
        Number(r.latitude) <= maxLat &&
        Number(r.longitude) >= minLon &&
        Number(r.longitude) <= maxLon
      );
    }).map((r) => ({
      id: r.id,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      type: r.category || "Reported",
      description: r.description || "User reported incident",
      severity: r.severity ?? null,
      startTime: r.createdAt,
    }));

    const combinedTraffic = [...traffic, ...reported];

    // For now: simple static crime zones (later: replace with real open data)
    const crime = [
      {
        id: "crime-1",
        name: "High Crime Zone",
        risk: "high",
        geojson: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [77.5805, 12.9752],
                [77.5835, 12.9752],
                [77.5835, 12.9785],
                [77.5805, 12.9785],
                [77.5805, 12.9752],
              ],
            ],
          },
        },
      },
    ];

    return res.json({ traffic: combinedTraffic, crime });
  } catch (err) {
    console.error("❌ /incidents BACKEND ERROR:", err?.response?.data || err);
    res.status(500).json({ message: "Failed to load incidents" });
  }
});

// ------------------------------------------------------------------
// Accept user-reported incidents from the frontend and store them in-memory
// ------------------------------------------------------------------
app.post("/incidents/report", (req, res) => {
  try {
    const { category, description, latitude, longitude, reporter } = req.body || {};

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (!category || Number.isNaN(lat) || Number.isNaN(lon) || !description) {
      return res.status(400).json({ message: "category, description, latitude and longitude are required" });
    }

    const id = `report-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
    const rec = {
      id,
      category,
      description,
      latitude: lat,
      longitude: lon,
      reporter: reporter || null,
      createdAt: Date.now(),
    };

    REPORTED_INCIDENTS.push(rec);
    console.log("New reported incident:", rec);

    return res.json({ ok: true, id });
  } catch (e) {
    console.error("/incidents/report error", e);
    return res.status(500).json({ message: "Failed to record incident" });
  }
});

// ---------------------------
// DASHBOARD DATA ENDPOINT
// ---------------------------
app.get("/dashboard", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon ?? req.query.lng);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ message: "Missing lat/lon" });
    }

    const key = process.env.TOMTOM_API_KEY;

    // 1) Fetch nearby traffic incidents (~5km radius)
    const bbox = `${lon - 0.05},${lat - 0.05},${lon + 0.05},${lat + 0.05}`;

    //const incidentURL = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${key}&bbox=${bbox}&fields=incidents&language=en-GB`;
     // Remove invalid categoryFilter (-1). Fetch without categoryFilter.
     const incidentURL = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${key}&bbox=${bbox}&language=en-GB`;

    let incData = {};
    try {
      const incRes = await fetch(incidentURL);
      incData = await incRes.json();
    } catch (err) {
      console.error("❌ TomTom dashboard incidents fetch error:", err);
      incData = { incidents: [] };
    }
      const tomtomIncidents = (incData.incidents || []);
      console.log(`Dashboard: TomTom returned ${tomtomIncidents.length} incidents for bbox ${bbox}`);

      const incidents = (tomtomIncidents || [])
        .map((i) => {
          const lat = i.geometry?.center?.lat;
          const lon = i.geometry?.center?.lon;
          if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return null;
          return {
            lat: Number(lat),
            lon: Number(lon),
            type: i.properties?.iconCategory,
            description: i.properties?.description,
          };
        })
        .filter(Boolean);

      // Include any user-reported incidents that fall inside the dashboard bbox
      const reportedForDashboard = REPORTED_INCIDENTS.filter((r) => {
        return (
          Number(r.latitude) >= lat - 0.05 &&
          Number(r.latitude) <= lat + 0.05 &&
          Number(r.longitude) >= lon - 0.05 &&
          Number(r.longitude) <= lon + 0.05
        );
      }).map((r) => ({ lat: Number(r.latitude), lon: Number(r.longitude), type: r.category, description: r.description }));

      if (reportedForDashboard.length > 0) {
        console.log(`Dashboard: Including ${reportedForDashboard.length} user-reported incidents`);
      }

      const combinedIncidents = [...incidents, ...reportedForDashboard];

    // 2) Count them for safety score (include reported incidents)
    const safetyScore = Math.max(20, 100 - combinedIncidents.length * 5);

    // 3) Weather (OpenWeather)
    const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_KEY}&units=metric`;

    const wRes = await fetch(weatherURL);
    const weather = await wRes.json();

    return res.json({
      safetyScore,
      incidentCount: combinedIncidents.length,
      incidents: combinedIncidents,
      weather: {
        temp: weather.main.temp,
        feels: weather.main.feels_like,
        condition: weather.weather[0].main
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Dashboard error" });
  }
});

/* ------------------------------------------------------------------
 *  PHASE 2: WEATHER ENDPOINT  (OpenWeather)
 *  ---------------------------------------------------------------- */
app.get("/weather", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon ?? req.query.lng);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res
        .status(400)
        .json({ message: "lat and lon (or lng) query params are required" });
    }

    if (!OPENWEATHER_KEY) {
      return res.status(500).json({
        message:
          "Missing OPENWEATHER_API_KEY in backend .env (required for /weather)",
      });
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_KEY}`;

    const wRes = await axios.get(url);
    const w = wRes.data;

    return res.json({
      temp: w.main?.temp,
      feelsLike: w.main?.feels_like,
      humidity: w.main?.humidity,
      description: w.weather?.[0]?.description,
      icon: w.weather?.[0]?.icon,
      visibility: w.visibility,
      windSpeed: w.wind?.speed,
      raw: w, // keep raw if you want more later
    });
  } catch (err) {
    console.error("❌ /weather BACKEND ERROR:", err?.response?.data || err);
    res.status(500).json({ message: "Failed to fetch weather" });
  }
});

/* ------------------------------------------------------------------
 *  PHASE 2: SAFETY SCORE ENDPOINT
 *  Combines incidents + weather into one score
 *  ---------------------------------------------------------------- */
app.get("/safety-score", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon ?? req.query.lng);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res
        .status(400)
        .json({ message: "lat and lon (or lng) query params are required" });
    }

    // Get incidents + weather in parallel
    const [incidentsRes, weatherRes] = await Promise.all([
      axios.get("http://localhost:3000/incidents", {
        params: { lat, lon },
      }),
      OPENWEATHER_KEY
        ? axios.get("http://localhost:3000/weather", {
            params: { lat, lon },
          })
        : Promise.resolve({ data: null }),
    ]);

    const incidents = incidentsRes.data.traffic || [];
    const crime = incidentsRes.data.crime || [];
    const weather = weatherRes.data;

    // Basic scoring model (you can tune later)
    let score = 100;
    let weatherRisk = "normal";

    // Each incident reduces 2 pts (max 30)
    score -= Math.min(incidents.length * 2, 30);

    // Each crime zone reduces 10 pts (max 30)
    score -= Math.min(crime.length * 10, 30);

    if (weather && weather.description) {
      const d = weather.description.toLowerCase();
      if (d.includes("rain") || d.includes("storm") || d.includes("thunder")) {
        score -= 15;
        weatherRisk = "rain/storm";
      } else if (d.includes("fog") || d.includes("mist")) {
        score -= 10;
        weatherRisk = "low visibility";
      }
    }

    score = Math.max(0, Math.min(100, score));

    return res.json({
      score,
      nearbyIncidents: incidents.length,
      crimeZones: crime.length,
      weatherRisk,
      weather,
    });
  } catch (err) {
    console.error("❌ /safety-score BACKEND ERROR:", err?.response?.data || err);
    res.status(500).json({ message: "Failed to compute safety score" });
  }
});

/* ------------------------------------------------------------------
 *  EMERGENCY TRACKING (lightweight, in-memory)
 *  - POST /emergency/start  { origin: {lat, lon}, contacts?: [] }
 *    -> returns { sessionId, trackingUrl }
 *  - GET  /emergency/track/:id  -> simple HTML page (for contacts to open)
 *  - POST /emergency/ack/:id    -> mark ack for session
 *  - GET  /emergency/status/:id -> { ackCount, acknowledged }
 *
 *  NOTE: This is intentionally simple for a hackathon demo. Sessions live
 *  in memory and will be lost on server restart.
 * ------------------------------------------------------------------
*/

const crypto = require("crypto");
const EMERGENCY_SESSIONS = {}; // sessionId -> { origin, contacts, startedAt, acks: [] }

app.post("/emergency/start", (req, res) => {
  try {
    const { origin, contacts } = req.body || {};
    const lat = origin?.lat;
    const lon = origin?.lon;
    if (typeof lat !== "number" || typeof lon !== "number") {
      return res.status(400).json({ message: "origin {lat, lon} required" });
    }

    const sessionId = crypto.randomBytes(8).toString("hex");
    EMERGENCY_SESSIONS[sessionId] = {
      origin: { lat, lon },
      contacts: Array.isArray(contacts) ? contacts : [],
      startedAt: Date.now(),
      acks: [],
    };

    const trackingUrl = `${req.protocol}://${req.get("host")}/emergency/track/${sessionId}`;
    return res.json({ sessionId, trackingUrl });
  } catch (e) {
    console.error("/emergency/start error", e);
    return res.status(500).json({ message: "Failed to start emergency session" });
  }
});

// Simple tracking page that registers an ack when opened
app.get("/emergency/track/:id", (req, res) => {
  const id = req.params.id;
  const session = EMERGENCY_SESSIONS[id];
  if (!session) {
    return res.status(404).send("<h3>Tracking session not found</h3>");
  }

  // Serve a tiny HTML page that posts an ack back and shows a friendly message
  const html = `<!doctype html>
  <html>
    <head><meta charset="utf-8"><title>Shared Location</title></head>
    <body>
      <h3>Live location shared</h3>
      <p>Thanks — you are viewing the shared location and this will notify the sender.</p>
      <script>
        fetch('/emergency/ack/${id}', { method: 'POST' }).catch(()=>{});
      </script>
    </body>
  </html>`;

  res.setHeader("Content-Type", "text/html");
  return res.send(html);
});

app.post("/emergency/ack/:id", (req, res) => {
  const id = req.params.id;
  const session = EMERGENCY_SESSIONS[id];
  if (!session) return res.status(404).json({ message: "session not found" });

  // record a simple ack (ip + timestamp) - we don't try to identify the person
  const stamp = { at: Date.now(), ip: req.ip };
  session.acks.push(stamp);
  return res.json({ ok: true });
});

app.get("/emergency/status/:id", (req, res) => {
  const id = req.params.id;
  const session = EMERGENCY_SESSIONS[id];
  if (!session) return res.status(404).json({ message: "session not found" });

  return res.json({ ackCount: session.acks.length, acknowledged: session.acks });
});

/* ------------------------------------------------------------------
 *  SERVER START
 *  ---------------------------------------------------------------- */
app.listen(3000, () => {
  console.log("🚀 Backend running on http://localhost:3000");
});

