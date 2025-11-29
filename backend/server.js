// backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Utility: Convert TomTom route → GeoJSON
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
 * Utility: Safety scoring (simple example)
 */
function computeSafetyScore(routePoints) {
  if (!routePoints || routePoints.length === 0) return 50;

  // Example scoring logic
  let nightPenalty = 10; // low light = unsafe
  let junctionPenalty = 8; // crowded intersection

  return Math.max(0, 100 - nightPenalty - junctionPenalty);
}

app.post("/route", async (req, res) => {
  try {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const key = process.env.TOMTOM_API_KEY;

    // -------------------------------
    // 1) FASTEST ROUTE (real TomTom)
    // -------------------------------
    const fastestURL = `https://api.tomtom.com/routing/1/calculateRoute/${origin.lat},${origin.lng}:${destination.lat},${destination.lng}/json?key=${key}&routeType=fastest&traffic=true`;

    const fastestRes = await axios.get(fastestURL);
    const fastestLeg = fastestRes.data.routes?.[0]?.legs?.[0];

    if (!fastestLeg) {
      return res.status(500).json({ message: "Fastest route not found" });
    }

    const fastestPoints = fastestLeg.points;
    const fastestGeoJSON = toGeoJSON(fastestPoints);

    const fastestTime = fastestRes.data.routes[0].summary.travelTimeInSeconds / 60;
    const fastestDistance = fastestRes.data.routes[0].summary.lengthInMeters / 1000;

    // --------------------------------
    // 2) SAFEST ROUTE (same route now
    // but you can replace with real ML)
    // --------------------------------
    const safestURL = `https://api.tomtom.com/routing/1/calculateRoute/${origin.lat},${origin.lng}:${destination.lat},${destination.lng}/json?key=${key}&routeType=shortest&traffic=false`;

    const safestRes = await axios.get(safestURL);
    const safestLeg = safestRes.data.routes?.[0]?.legs?.[0];

    if (!safestLeg) {
      return res.status(500).json({ message: "Safest route not found" });
    }

    const safestPoints = safestLeg.points;
    const safestGeoJSON = toGeoJSON(safestPoints);

    const safestTime = safestRes.data.routes[0].summary.travelTimeInSeconds / 60;
    const safestDistance = safestRes.data.routes[0].summary.lengthInMeters / 1000;

    // Compute safety score (replace with ML later)
    const safeScore = computeSafetyScore(safestPoints);

    const warnings = [
      "Low-light area detected",
      "Crowded junction ahead",
    ];

    // ---------------------------
    // FINAL RESPONSE TO FRONTEND
    // ---------------------------
    return res.json({
      fastest: {
        geojson: fastestGeoJSON,
        travelTime: Number(fastestTime.toFixed(1)),
        distance: Number(fastestDistance.toFixed(1)),
        warnings: [],
      },
      safest: {
        geojson: safestGeoJSON,
        safeScore,
        travelTime: Number(safestTime.toFixed(1)),
        distance: Number(safestDistance.toFixed(1)),
        warnings,
      },
    });
  } catch (err) {
    console.error("❌ BACKEND ERROR:", err);
    res.status(500).json({ message: "Route calculation failed" });
  }
});

app.listen(3000, () => {
  console.log("🚀 Backend running on http://localhost:3000");
});
