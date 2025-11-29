import { useState } from "react";
import { MapPin, Send, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MapContainer from "@/components/Map/MapContainer";
import { useToast } from "@/hooks/use-toast";

const ReportIncident = () => {
  const { toast } = useToast();
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const categories = [
    { value: "theft", label: "Theft" },
    { value: "assault", label: "Assault" },
    { value: "suspicious", label: "Suspicious Activity" },
    { value: "lighting", label: "Poor Lighting" },
    { value: "harassment", label: "Harassment" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement Supabase submission
    toast({
      title: "Report Submitted",
      description: "Thank you for helping keep the community safe.",
    });
    setCategory("");
    setLocation("");
    setDescription("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Report an Incident</h1>
          <p className="text-muted-foreground">
            Help keep your community safe by reporting safety concerns
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Category <span className="text-destructive">*</span>
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select incident type" />
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

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Location <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Enter location or click on map"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Description <span className="text-destructive">*</span>
                </label>
                <Textarea
                  placeholder="Describe what happened..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px]"
                  required
                />
              </div>

              <div className="p-4 rounded-lg bg-warning-light border border-warning/20">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-warning-foreground mb-1">
                      Report Responsibly
                    </p>
                    <p className="text-muted-foreground">
                      Please only report genuine safety concerns. False reports may
                      result in account suspension.
                    </p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full gradient-primary" size="lg">
                <Send className="w-5 h-5 mr-2" />
                Submit Report
              </Button>
            </form>
          </Card>

          {/* Map */}
          <div className="lg:sticky lg:top-24 h-[600px]">
            <MapContainer>
              <div className="absolute top-4 left-4 right-4">
                <Card className="glass p-3">
                  <p className="text-sm text-muted-foreground">
                    Click on the map to set incident location
                  </p>
                </Card>
              </div>
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportIncident;
