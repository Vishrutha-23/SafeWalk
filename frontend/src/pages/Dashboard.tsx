import { Shield, MapPin, AlertTriangle, Cloud, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  // Dummy data
  const safetyScore = 85;
  const nearbyAlerts = [
    { id: 1, type: "theft", location: "Main St & 5th Ave", time: "2h ago" },
    { id: 2, type: "suspicious", location: "Park Avenue", time: "4h ago" },
    { id: 3, type: "lighting", location: "Oak Street", time: "1d ago" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">Your safety dashboard</p>
        </div>

        {/* Safety Score Card */}
        <Card className="p-8 mb-8 gradient-primary text-white border-0 shadow-xl hover-lift">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-8 h-8" />
                <h2 className="text-2xl font-semibold">Current Safety Score</h2>
              </div>
              <p className="text-white/80 mb-4">Based on your area and current conditions</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-bold">{safetyScore}</span>
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
              <p className="text-muted-foreground">
                Get the safest route to your destination
              </p>
            </Card>
          </Link>

          <Link to="/alerts">
            <Card className="p-6 hover-lift cursor-pointer border-2 hover:border-warning transition-colors">
              <AlertTriangle className="w-10 h-10 text-warning mb-4" />
              <h3 className="text-xl font-semibold mb-2">Browse Alerts</h3>
              <p className="text-muted-foreground">
                View community safety reports in your area
              </p>
            </Card>
          </Link>
        </div>

        {/* Weather Widget */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-4">
            <Cloud className="w-12 h-12 text-accent" />
            <div>
              <h3 className="text-lg font-semibold">Current Weather</h3>
              <p className="text-muted-foreground">Sunny, 72°F - Good visibility</p>
            </div>
          </div>
        </Card>

        {/* Nearby Alerts */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-warning" />
            Nearby Alerts
          </h3>
          <div className="space-y-3">
            {nearbyAlerts.map((alert) => (
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
