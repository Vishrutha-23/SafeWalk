// frontend/src/components/Map/IncidentLayer.tsx
import { useEffect } from "react";
import tt from "@tomtom-international/web-sdk-maps";

interface IncidentLayerProps {
  map: tt.Map | null;
  incidents: any[];
  crimeZones: any[];
  hazards: any[];
  policeStations: any[];
  highlightedIncidentId?: string | null;
}

const IncidentLayer: React.FC<IncidentLayerProps> = ({
  map,
  incidents,
  crimeZones,
  hazards,
  policeStations,
  highlightedIncidentId,
}) => {
  useEffect(() => {
    if (!map) return;

    const incidentSourceId = "sw-incidents";
    const incidentLayerId = "sw-incidents-layer";
    const incidentHighlightId = "sw-incidents-highlight-layer";

    const hazardSourceId = "sw-hazards";
    const hazardLayerId = "sw-hazards-layer";

    const policeSourceId = "sw-police";
    const policeLayerId = "sw-police-layer";

    const crimeSourceId = "sw-crime";
    const crimeLayerId = "sw-crime-layer";

    // ------------------ INCIDENTS (points) ------------------
    const incidentGeojson = {
      type: "FeatureCollection",
      features: (incidents || [])
        .filter((i: any) => i.latitude && i.longitude)
        .map((i: any) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [i.longitude, i.latitude],
          },
          properties: {
            id: i.id,
            type: i.type || "Incident",
            description: i.description || "",
          },
        })),
    };

    if (!map.getSource(incidentSourceId)) {
      map.addSource(incidentSourceId, {
        type: "geojson",
        data: incidentGeojson as any,
      });

      map.addLayer({
        id: incidentLayerId,
        type: "circle",
        source: incidentSourceId,
        paint: {
          "circle-radius": 7,
          "circle-color": "#ff2d55",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1,
        },
      });

      // highlight layer
      map.addLayer({
        id: incidentHighlightId,
        type: "circle",
        source: incidentSourceId,
        paint: {
          "circle-radius": 12,
          "circle-color": "#ffcc00",
          "circle-stroke-color": "#000000",
          "circle-stroke-width": 2,
        },
        filter: ["==", ["get", "id"], ""],
      } as any);

      // Add a small symbol (exclamation) above incidents for visibility
      const incidentSymbolId = "sw-incidents-symbol";
      map.addLayer({
        id: incidentSymbolId,
        type: "symbol",
        source: incidentSourceId,
        layout: {
          "text-field": "!",
          "text-size": 14,
          "text-offset": [0, -0.9],
          "text-anchor": "bottom",
        },
        paint: {
          "text-color": "#fff",
        },
      } as any);
    } else {
      const src = map.getSource(incidentSourceId) as tt.GeoJSONSource;
      src.setData(incidentGeojson as any);
    }

    // Update highlight filter
    if (map.getLayer(incidentHighlightId)) {
      const targetId = highlightedIncidentId || "";
      (map as any).setFilter(incidentHighlightId, [
        "==",
        ["get", "id"],
        targetId,
      ]);
    }

    // ------------------ HAZARDS (points) ------------------
    const hazardsGeojson = {
      type: "FeatureCollection",
      features: (hazards || [])
        .filter((h: any) => h.latitude && h.longitude)
        .map((h: any) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [h.longitude, h.latitude],
          },
          properties: {
            id: h.id,
            label: h.label || "Hazard",
          },
        })),
    };

    if (!map.getSource(hazardSourceId)) {
      map.addSource(hazardSourceId, {
        type: "geojson",
        data: hazardsGeojson as any,
      });

      map.addLayer({
        id: hazardLayerId,
        type: "circle",
        source: hazardSourceId,
        paint: {
          "circle-radius": 6,
          "circle-color": "#fbbf24", // amber
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1,
        },
      });
    } else {
      const src = map.getSource(hazardSourceId) as tt.GeoJSONSource;
      src.setData(hazardsGeojson as any);
    }

    // ------------------ POLICE STATIONS (points) ------------------
    const policeGeojson = {
      type: "FeatureCollection",
      features: (policeStations || [])
        .filter((p: any) => p.latitude && p.longitude)
        .map((p: any) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [p.longitude, p.latitude],
          },
          properties: {
            id: p.id,
            name: p.name || "Police Station",
          },
        })),
    };

    if (!map.getSource(policeSourceId)) {
      map.addSource(policeSourceId, {
        type: "geojson",
        data: policeGeojson as any,
      });

      map.addLayer({
        id: policeLayerId,
        type: "circle",
        source: policeSourceId,
        paint: {
          "circle-radius": 6,
          "circle-color": "#22c55e", // green
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1,
        },
      });
    } else {
      const src = map.getSource(policeSourceId) as tt.GeoJSONSource;
      src.setData(policeGeojson as any);
    }

    // ------------------ CRIME ZONES (polygons) ------------------
    const crimeGeojson = {
      type: "FeatureCollection",
      features: (crimeZones || [])
        .filter((z: any) => z.geojson && z.geojson.geometry)
        .map((z: any) => ({
          type: "Feature",
          geometry: z.geojson.geometry,
          properties: {
            id: z.id,
            name: z.name || "Crime zone",
            risk: z.risk || "high",
          },
        })),
    };

    if (!map.getSource(crimeSourceId)) {
      map.addSource(crimeSourceId, {
        type: "geojson",
        data: crimeGeojson as any,
      });

      map.addLayer({
        id: crimeLayerId,
        type: "fill",
        source: crimeSourceId,
        paint: {
          "fill-color": "#ef4444",
          "fill-opacity": 0.25,
          "fill-outline-color": "#b91c1c",
        },
      });
    } else {
      const src = map.getSource(crimeSourceId) as tt.GeoJSONSource;
      src.setData(crimeGeojson as any);
    }
  }, [map, incidents, crimeZones, hazards, policeStations, highlightedIncidentId]);

  return null;
};

export default IncidentLayer;
