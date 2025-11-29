import { useState } from "react";
import { AlertTriangle, Filter, MapPin, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MapContainer from "@/components/Map/MapContainer";

const Alerts = () => {
  const [filterCategory, setFilterCategory] = useState("all");

  // Dummy alerts data
  const alerts = [
    {
      id: 1,
      category: "theft",
      title: "Bike Theft Reported",
      location: "Main Street & 5th Ave",
      time: "2 hours ago",
      description: "Bicycle stolen from bike rack near coffee shop",
      severity: "medium",
    },
    {
      id: 2,
      category: "suspicious",
      title: "Suspicious Activity",
      location: "Park Avenue",
      time: "4 hours ago",
      description: "Suspicious person loitering near residential area",
      severity: "low",
    },
    {
      id: 3,
      category: "assault",
      title: "Assault Reported",
      location: "Oak Street",
      time: "1 day ago",
      description: "Physical altercation reported",
      severity: "high",
    },
    {
      id: 4,
      category: "lighting",
      title: "Poor Street Lighting",
      location: "Elm Boulevard",
      time: "2 days ago",
      description: "Multiple street lights out, area very dark at night",
      severity: "low",
    },
  ];

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "theft", label: "Theft" },
    { value: "assault", label: "Assault" },
    { value: "suspicious", label: "Suspicious Activity" },
    { value: "lighting", label: "Poor Lighting" },
    { value: "harassment", label: "Harassment" },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-destructive bg-destructive-light";
      case "medium":
        return "border-warning bg-warning-light";
      default:
        return "border-border bg-muted";
    }
  };

  const filteredAlerts =
    filterCategory === "all"
      ? alerts
      : alerts.filter((alert) => alert.category === filterCategory);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Community Alerts</h1>
            <p className="text-muted-foreground">
              Recent safety reports in your area
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={`p-5 border-l-4 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">{alert.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {alert.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {alert.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground ml-8">
                  {alert.description}
                </p>
                <Button variant="outline" size="sm" className="mt-4 ml-8">
                  View on Map
                </Button>
              </Card>
            ))}
          </div>

          {/* Map */}
          <div className="lg:sticky lg:top-24 h-[700px]">
            <MapContainer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
