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
  const [selectedRoute, setSelectedRoute] = useState<
    "fastest" | "safest" | null
  >(null);

  const [tracking, setTracking] = useState(false);
  const [autoCenter, setAutoCenter] = useState(true);

  // -----------------------------
  // PLAN ROUTE
  // -----------------------------
  const handlePlanRoute = async () => {
    try {
      const originCoords = await geocodeText(origin);
      const destinationCoords = await geocodeText(destination);

      const data = await getRouteFromBackend(originCoords, destinationCoords);

      console.log("BACKEND:", data);

      // Save fastest + safest
      setBackendData({
        fastest: data.fastest,
        safest: data.safest,
      });

      // default draw safest
      setSelectedRoute("safest");
      setRouteData(data.safest.geojson);

      alert("Routes Generated!");
    } catch (err) {
      console.error(err);
      alert("Route error");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-4xl font-bold mb-8">Plan Your Route</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* LEFT PANEL */}
          <div className="space-y-6">
            {/* Input Card */}
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
                  <label className="text-sm font-medium mb-2 block">
                    Destination
                  </label>
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

                {/* Fastest / Safest Buttons */}
                {backendData && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setSelectedRoute("fastest");
                        setRouteData(backendData.fastest.geojson);
                      }}
                      className="px-3 py-2 rounded bg-gray-200"
                    >
                      Fastest Route ({backendData.fastest.travelTime} mins)
                    </button>

                    <button
                      onClick={() => {
                        setSelectedRoute("safest");
                        setRouteData(backendData.safest.geojson);
                      }}
                      className="px-3 py-2 rounded bg-green-300"
                    >
                      Safest Route ({backendData.safest.safeScore}/100)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SAFETY PANEL */}
            {selectedRoute === "safest" && backendData?.safest && (
              <div className="p-4 bg-white rounded shadow border">
                <h2 className="font-bold text-lg">Safest Route</h2>
                <p>Safe Score: {backendData.safest.safeScore}</p>
                <p>Distance: {backendData.safest.distance} km</p>
                <p>Travel Time: {backendData.safest.travelTime} mins</p>

                <h3 className="mt-2 font-semibold">Warnings:</h3>
                <ul className="list-disc ml-5">
                  {backendData.safest.warnings.map((w: string, i: number) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedRoute === "fastest" && backendData?.fastest && (
              <div className="p-4 bg-white rounded shadow border">
                <h2 className="font-bold text-lg">Fastest Route</h2>
                <p>Distance: {backendData.fastest.distance} km</p>
                <p>Travel Time: {backendData.fastest.travelTime} mins</p>
              </div>
            )}
          </div>

          {/* RIGHT SIDE MAP */}
          <div
            className="relative lg:sticky lg:top-24"
            style={{ height: "80vh" }}
          >
            {/* Tracking Controls */}
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
