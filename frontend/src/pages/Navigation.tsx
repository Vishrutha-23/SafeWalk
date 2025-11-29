import { ArrowUp, AlertCircle, Navigation as NavigationIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MapContainer from "@/components/Map/MapContainer";

const Navigation = () => {
  // Dummy navigation data
  const currentInstruction = "Turn right onto Main Street";
  const nextInstruction = "In 0.3 miles, turn left onto Park Avenue";
  const eta = "12 min";
  const distance = "1.8 mi";

  const alerts = [
    { id: 1, message: "Heavy traffic ahead", severity: "warning" },
    { id: 2, message: "Recent theft reported nearby", severity: "danger" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Map Container */}
      <div className="relative h-screen">
        <MapContainer>
          {/* Navigation Overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
            <Card className="glass p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">ETA: {eta}</span>
                <span className="text-sm text-muted-foreground">{distance}</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <ArrowUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{currentInstruction}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {nextInstruction}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Safety Alerts Panel */}
          {alerts.length > 0 && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
              <Card className="glass p-4 space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  Safety Alerts
                </h3>
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg ${
                      alert.severity === "danger"
                        ? "bg-destructive-light"
                        : "bg-warning-light"
                    }`}
                  >
                    <p className="text-sm">{alert.message}</p>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* Control Buttons */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
            <Button size="lg" className="rounded-full gradient-primary shadow-lg">
              <NavigationIcon className="w-5 h-5 mr-2" />
              End Navigation
            </Button>
          </div>
        </MapContainer>
      </div>
    </div>
  );
};

export default Navigation;
