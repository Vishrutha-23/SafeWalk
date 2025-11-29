res.json({
  geojson: routeGeoJSON,   // your actual route geojson
  safeScore: safeScore || 82, 
  travelTime: travelTime || 25,
  distance: distance || 8.4,
  warnings: warnings || [
    "Low-light area detected",
    "Crowded junction ahead"
  ]
});
