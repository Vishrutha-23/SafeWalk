// frontend/src/components/RoutePlanner.tsx
import React, { useState } from "react";
import { getRouteFromBackend } from "@/services/routingService";
import { geocodeText } from "@/services/geocodingService";

interface RoutePlannerProps {
  mapRef: any;
}

const RoutePlanner: React.FC<RoutePlannerProps> = ({ mapRef }) => {
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ FIX: Place backendData INSIDE the component
  const [backendData, setBackendData] = useState<any>(null);

  const clearRoute = () => {
    const map = mapRef.current;
    if (!map) return;

    try {
      if (map.getLayer("sw-route-layer")) map.removeLayer("sw-route-layer");
      if (map.getSource("sw-route-source")) map.removeSource("sw-route-source");
    } catch (e) {
      console.warn("clear error:", e);
    }
  };

  const planRoute = async () => {
    if (!destination) {
      alert("Enter destination");
      return;
    }

    setLoading(true);

    try {
      const map = mapRef.current;
      if (!map) throw new Error("Map not ready");

      const center = map.getCenter();
      const originCoords = { lat: center.lat, lng: center.lng };

      // Convert destination text → coordinates
      const destinationCoords = await geocodeText(destination);

      // 🔥 CALL BACKEND
      const result = await getRouteFromBackend(originCoords, destinationCoords);

      console.log("Backend returned:", result);

      // SAVE BACKEND SAFETY PANEL DATA
      setBackendData(result.safety || null);

      if (!result.geojson) throw new Error("Invalid backend route response");

      clearRoute();

      map.addSource("sw-route-source", {
        type: "geojson",
        data: result.geojson,
      });

      map.addLayer({
        id: "sw-route-layer",
        type: "line",
        source: "sw-route-source",
        paint: {
          "line-color": "#007aff",
          "line-width": 5,
        },
      });

      // Fit map to route
      const coords = result.geojson.geometry.coordinates;
      const bounds = new window.tt.LngLatBounds(coords[0], coords[0]);
      coords.forEach((c) => bounds.extend(c));

      map.fitBounds(bounds, { padding: 50, duration: 600 });
    } catch (err: any) {
      console.error("Route error:", err);
      alert(err.message || "Route planning failed");
    }

    setLoading(false);
  };

  return (
    <div className="p-2 bg-white/90 rounded shadow-sm">

      {/* 🟦 SAFETY PANEL */}
      {backendData && (
        <div className="mt-4 p-4 bg-white rounded shadow border">
          <h2 className="font-bold text-lg mb-2">Route Safety Analysis</h2>

          <p><b>Safe Score:</b> {backendData.safeScore}/100</p>
          <p><b>Travel Time:</b> {backendData.travelTime} mins</p>
          <p><b>Distance:</b> {backendData.distance} km</p>

          <h3 className="font-semibold mt-3">Warnings:</h3>
          <ul className="list-disc ml-6">
            {backendData.warnings?.map((w: string, idx: number) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter destination"
          className="flex-1 border px-3 py-2 rounded"
        />

        <button
          onClick={planRoute}
          disabled={loading}
          className="px-3 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? "Planning..." : "Plan"}
        </button>

        <button onClick={clearRoute} className="px-3 py-2 border rounded">
          Clear
        </button>
      </div>
    </div>
  );
};

export default RoutePlanner;
