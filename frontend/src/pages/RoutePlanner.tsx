// frontend/src/pages/RoutePlanner.tsx
import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import MapContainer from "@/components/Map/MapContainer";
import { getRouteFromBackend } from "@/services/routingService";
import { geocodeText } from "@/services/geocodingService";

const RoutePlanner = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routeData, setRouteData] = useState<any>(null);
  const [backendData, setBackendData] = useState<any>(null);

  const [tracking, setTracking] = useState(false);
  const [autoCenter, setAutoCenter] = useState(true);

  const handlePlanRoute = async () => {
    if (!origin || !destination) {
      alert("Please enter both origin and destination");
      return;
    }

    try {
      console.log("Calling backend route API...");

      // Convert text → coords
      const originCoords = await geocodeText(origin);
      const destinationCoords = await geocodeText(destination);

      console.log("Origin coords:", originCoords);
      console.log("Destination coords:", destinationCoords);

      // Call backend
      const result = await getRouteFromBackend(originCoords, destinationCoords);
      console.log("Backend returned:", result);

      if (!result || !result.geojson) {
        alert("Backend returned invalid route");
        return;
      }

      // Blue route line
      setRouteData(result.geojson);

      // Safety panel
      setBackendData({
        safeScore: result.safeScore,
        travelTime: result.travelTime,
        distance: result.distance,
        warnings: result.warnings || [],
      });

      alert("Route generated successfully!");
    } catch (err) {
      console.error("Route error:", err);
      alert("Route request failed");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-4xl font-bold mb-8">Plan Your Route</h1>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* LEFT SIDE */}
          <div className="space-y-6">

            {/* Input form */}
            <div className="p-6 bg-white rounded shadow">
              <div className="space-y-4">

                {/* Origin */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Origin</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      placeholder="Enter starting point"
                      className="w-full border px-3 py-2 rounded pl-10"
                    />
                  </div>
                </div>

                {/* Destination */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Destination</label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Enter destination"
                      className="w-full border px-3 py-2 rounded pl-10"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePlanRoute}
                  className="w-full bg-blue-600 text-white py-2 rounded"
                >
                  Find Route
                </button>
              </div>
            </div>

            {/* SAFETY PANEL */}
            {backendData && (
              <div className="p-4 bg-white rounded shadow border">
                <h2 className="font-bold text-lg mb-2">Route Safety Analysis</h2>

                <p><b>Safe Score:</b> {backendData.safeScore}/100</p>
                <p><b>Travel Time:</b> {backendData.travelTime} mins</p>
                <p><b>Distance:</b> {backendData.distance} km</p>

                <h3 className="font-semibold mt-3">Warnings:</h3>
                <ul className="list-disc ml-6">
                  {backendData.warnings.map((w: string, i: number) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* RIGHT SIDE MAP */}
          <div className="relative lg:sticky lg:top-24" style={{ height: "80vh" }}>

            {/* TRACKING BUTTONS */}
            <div className="absolute top-4 right-4 z-50 space-y-2">
              <button
                onClick={() => setTracking((prev) => !prev)}
                className="px-3 py-2 bg-blue-600 text-white rounded shadow"
              >
                {tracking ? "Stop Tracking" : "Start Tracking"}
              </button>

              <button
                onClick={() => setAutoCenter((prev) => !prev)}
                className="px-3 py-2 bg-gray-200 rounded shadow"
              >
                Auto‑Center: {autoCenter ? "ON" : "OFF"}
              </button>
            </div>

            {/* MAP */}
            <MapContainer
              enableTracking={tracking}
              autoCenter={autoCenter}
              routeData={routeData}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default RoutePlanner;
