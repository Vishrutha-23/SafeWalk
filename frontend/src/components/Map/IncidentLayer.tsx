// frontend/src/components/Map/IncidentLayer.tsx
import { useEffect } from "react";
import tt from "@tomtom-international/web-sdk-maps";

interface Props {
  map: tt.Map | null;
  trafficIncidents?: any;
  crimeZones?: any;
}

const IncidentLayer: React.FC<Props> = ({ map, trafficIncidents, crimeZones }) => {
  useEffect(() => {
    if (!map) return;

    // ---------------------------
    // 1) TRAFFIC INCIDENT MARKERS
    // ---------------------------
    if (trafficIncidents?.length) {
      trafficIncidents.forEach((inc: any, i: number) => {
        const el = document.createElement("div");
        el.className = "traffic-marker";

        el.style.width = "14px";
        el.style.height = "14px";
        el.style.borderRadius = "50%";
        el.style.background = "red";
        el.style.border = "2px solid white";
        el.style.cursor = "pointer";

        const popup = new tt.Popup({ offset: 30 }).setHTML(`
          <b>${inc.type}</b><br>
          <small>${inc.description || "No details"}</small>
        `);

        new tt.Marker({ element: el })
          .setLngLat([inc.longitude, inc.latitude])
          .setPopup(popup)
          .addTo(map);
      });
    }

    // ---------------------------
    // 2) CRIME HOTSPOT POLYGONS
    // ---------------------------
    if (crimeZones?.length) {
      crimeZones.forEach((zone: any, i: number) => {
        const id = `crime-zone-${i}`;

        if (!map.getSource(id)) {
          map.addSource(id, {
            type: "geojson",
            data: zone.geojson,
          });

          map.addLayer({
            id: id,
            type: "fill",
            source: id,
            paint: {
              "fill-color": "rgba(255,0,0,0.25)",
              "fill-outline-color": "rgba(255,0,0,0.7)",
            },
          });
        }
      });
    }
  }, [map, trafficIncidents, crimeZones]);

  return null;
};

export default IncidentLayer;
