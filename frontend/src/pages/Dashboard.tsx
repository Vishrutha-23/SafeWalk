import { Shield, MapPin, AlertTriangle, Cloud, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

import { getNearbyIncidents } from "@/services/incidentService";
import { getWeatherAtLocation } from "@/services/weatherService";
import { getSafetyScore } from "@/services/safetyService";   // ✅ FIXED NAME

const Dashboard = () => {

  // -------------------------------
  // 🔥 STATE
  // -------------------------------
  const [safetyScore, setSafetyScore] = useState<number | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [nearbyAlerts, setNearbyAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(true);

  // -------------------------------
  // 🔥 GET USER LOCATION
  // -------------------------------
  const getLocation = () =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        reject
      );
    });

  // -------------------------------
  // 🔥 LOAD DASHBOARD DATA
  // -------------------------------
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const loc: any = await getLocation();

        // 1️⃣ Safety Score
        const scoreRes = await getSafetyScore(loc.latitude, loc.longitude);
        setSafetyScore(scoreRes.score ?? 80);

        // 2️⃣ Weather
        const weatherData = await getWeatherAtLocation(loc.latitude, loc.longitude);
        setWeather(weatherData);

        // 3️⃣ Nearby Alerts (traffic & crime)
        setAlertsLoading(true);
        const alertsRaw = await getNearbyIncidents(loc.latitude, loc.longitude);

        // Convert backend → UI expected fields, but only include incidents with coords
        const mappedAlerts = (alertsRaw.traffic || [])
          .map((a: any) => ({
            // normalize coords to numbers when possible
            latitude: Number(a.latitude),
            longitude: Number(a.longitude),
            raw: a,
          }))
          .filter((a: any) => Number.isFinite(a.latitude) && Number.isFinite(a.longitude))
          .map((a: any) => ({
            id: a.raw?.id ?? `${a.latitude},${a.longitude}-${Math.random().toString(36).slice(2,8)}`,
            type: a.raw?.type ?? "incident",
            location: `${a.latitude.toFixed(4)}, ${a.longitude.toFixed(4)}`,
            time: a.raw?.startTime ? new Date(a.raw.startTime).toLocaleTimeString() : "",
          }));

        setNearbyAlerts(mappedAlerts);
        setAlertsLoading(false);

      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    };

    loadDashboard();
  }, []);

  // -------------------------------
  // 🔥 FALLBACKS
  // -------------------------------
  const displaySafety = safetyScore ?? 80;
  const displayWeatherText = weather?.description ?? "Loading weather...";

  const displayAlerts = alertsLoading
    ? [{ id: "loading", type: "loading...", location: "Please wait", time: "" }]
    : nearbyAlerts.length > 0
    ? nearbyAlerts
    : [];

  // -------------------------------
  // 🔥 UI (UNCHANGED)
  // -------------------------------
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">Your safety dashboard</p>
        </div>

        {/* Safety Score */}
        <Card className="p-8 mb-8 gradient-primary text-white border-0 shadow-xl hover-lift">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-8 h-8" />
                <h2 className="text-2xl font-semibold">Current Safety Score</h2>
              </div>
              <p className="text-white/80 mb-4">Based on your area and current conditions</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-bold">{displaySafety}</span>
                <span className="text-2xl">/100</span>
              </div>
            </div>
            <TrendingUp className="w-12 h-12 text-white/60" />
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link to="/route-planner">
            <Card className="p-6 hover-lift cursor-pointer border-2 hover:border-primary transition-colors">
              <MapPin className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Plan Safe Route</h3>
              <p className="text-muted-foreground">Get the safest route</p>
            </Card>
          </Link>

          <Link to="/alerts">
            <Card className="p-6 hover-lift cursor-pointer border-2 hover:border-warning transition-colors">
              <AlertTriangle className="w-10 h-10 text-warning mb-4" />
              <h3 className="text-xl font-semibold mb-2">Browse Alerts</h3>
              <p className="text-muted-foreground">View community reports</p>
            </Card>
          </Link>
        </div>

        {/* Weather */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-4">
            <Cloud className="w-12 h-12 text-accent" />
            <div>
              <h3 className="text-lg font-semibold">Current Weather</h3>
              <p className="text-muted-foreground">{displayWeatherText}</p>
            </div>
          </div>
        </Card>

        {/* Alerts */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-warning" />
            Nearby Alerts
          </h3>

          <div className="space-y-3">
            {alertsLoading && (
              <div className="p-4 text-sm text-muted-foreground">Loading alerts…</div>
            )}

            {!alertsLoading && displayAlerts.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">No nearby traffic alerts right now.</div>
            )}

            {!alertsLoading && displayAlerts.length > 0 && displayAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                <div>
                  <p className="font-medium capitalize">{alert.type}</p>
                  <p className="text-sm text-muted-foreground">{alert.location}</p>
                </div>
                <span className="text-sm text-muted-foreground">{alert.time}</span>
              </div>
            ))}
          </div>

          <Link to="/alerts">
            <Button variant="outline" className="w-full mt-4">
              View All Alerts
            </Button>
          </Link>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;
