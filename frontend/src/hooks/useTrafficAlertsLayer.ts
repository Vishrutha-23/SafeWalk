// src/hooks/useTrafficAlertsLayer.ts
import { useEffect } from "react";
import * as tt from "@tomtom-international/web-sdk-maps";
import { getTrafficAlertsAround, TrafficIncident } from "@/services/tomtom/alerts";

export function useTrafficAlertsLayer(
  mapRef: React.MutableRefObject<tt.Map | null>,
  center: [number, number], // [lat, lon]
  enabled: boolean
) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !enabled) return;

    const load = async () => {
      const [lat, lon] = center;
      const incidents: TrafficIncident[] = await getTrafficAlertsAround(lat, lon);

      const features: GeoJSON.Feature[] = incidents.map((i) => ({
        type: "Feature",
        properties: {
          id: i.id,
          severity: i.severity,
          description: i.description,
        },
        geometry: {
          type: "Point",
          coordinates: [i.point.lon, i.point.lat],
        },
      }));

      const collection: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features,
      };

      if (map.getSource("traffic-alerts")) {
        map.removeLayer("traffic-alerts-heat");
        map.removeLayer("traffic-alerts-points");
        map.removeSource("traffic-alerts");
      }

      map.addSource("traffic-alerts", {
        type: "geojson",
        data: collection,
      });

      // POINT LAYER
      map.addLayer({
        id: "traffic-alerts-points",
        type: "circle",
        source: "traffic-alerts",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "severity"],
            0, 4,
            100, 18
          ],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "severity"],
            0, "#00ff88",
            50, "#ffaa00",
            100, "#ff0044"
          ],
          "circle-opacity": 0.8,
        },
      });

      // HEATMAP LAYER
      map.addLayer({
        id: "traffic-alerts-heat",
        type: "heatmap",
        source: "traffic-alerts",
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "severity"],
            0, 0.2,
            100, 1
          ],
          "heatmap-intensity": 1.5,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(0,255,136,0)",
            0.5, "rgba(255,170,0,0.6)",
            1, "rgba(255,0,68,0.9)"
          ],
        },
      });
    };

    load();
  }, [mapRef, center, enabled]);
}
