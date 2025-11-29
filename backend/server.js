const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/route", async (req, res) => {
  try {
    const { origin, destination } = req.body;

    const URL = `https://api.tomtom.com/routing/1/calculateRoute/` +
      `${origin.lat},${origin.lng}:` +
      `${destination.lat},${destination.lng}/json?key=${process.env.TOMTOM_API_KEY}`;

    const ttResponse = await fetch(URL);
    const data = await ttResponse.json();

    const route = data.routes[0];
   // const coords = route.legs[0].points.map(p => [p.longitude, p.latitude]);

    const coords = route.legs[0].points
  .map(p => [p.longitude, p.latitude])
  .filter(c => 
    c[0] !== null &&
    c[1] !== null &&
    !isNaN(c[0]) &&
    !isNaN(c[1])
  );

  app.get("/incidents", (req, res) => {
  res.json({
    incidents: [
      {
        id: 1,
        type: "crime",
        title: "Recent Theft",
        lat: 12.9716,
        lon: 77.5946,
      },
      {
        id: 2,
        type: "police",
        title: "Police Patrol",
        lat: 12.9750,
        lon: 77.6000,
      },
      {
        id: 3,
        type: "hazard",
        title: "Low visibility zone",
        lat: 12.9680,
        lon: 77.5900,
      }
    ]
  });
});


const geojson = {
  type: "Feature",
  geometry: {
    type: "LineString",
    coordinates: coords
  }
};


    // ✅ Replace your old res.json({ geojson }) with this:
    res.json({
      geojson: geojson,
      safeScore: 82,  
      travelTime: Math.round(route.summary.travelTimeInSeconds / 60),
      distance: (route.summary.lengthInMeters / 1000).toFixed(1),
      warnings: [
        "Low‑light area detected",
        "Crowded junction ahead"
      ]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Route calculation failed" });
  }
});



app.listen(3000, () => {
  console.log("🚀 Backend running on http://localhost:3000");
});
