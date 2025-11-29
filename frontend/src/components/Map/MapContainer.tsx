// frontend/src/components/Map/MapContainer.tsx
import { useEffect, useRef } from "react";
import tt from "@tomtom-international/web-sdk-maps";
import useLiveLocation from "@/hooks/useLiveLocation";
import IncidentLayer from "./IncidentLayer";

interface MapContainerProps {
  enableTracking: boolean;
  autoCenter: boolean;
  routeData?: any;

  // Optional overlays (used on Alerts page)
  incidents?: any[];
  crimeZones?: any[];
  hazards?: any[];
  policeStations?: any[];
  highlightedIncidentId?: string | null;

  // Optional: allow parent to handle map clicks (returns {lat, lon})
  onMapClick?: (coords: { lat: number; lon: number }) => void;
  // Optional: coordinates to render a selected marker (used by ReportIncident)
  selectedCoords?: { lat: number; lon: number } | null;
}

const MapContainer: React.FC<MapContainerProps> = ({
  enableTracking,
  autoCenter,
  routeData,
  incidents = [],
  crimeZones = [],
  hazards = [],
  policeStations = [],
  highlightedIncidentId = null,
  onMapClick,
  selectedCoords = null,
}) => {
  const mapRef = useRef<tt.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);

  // live location hook (shows user position & tracking)
  useLiveLocation({ mapRef, enableTracking, autoCenter });

  // --------------------------
  // MAP INIT + ROUTE LAYER
  // --------------------------
  useEffect(() => {
    if (!mapDivRef.current) return;

    const map = tt.map({
      key: import.meta.env.VITE_TOMTOM_API_KEY,
      container: mapDivRef.current,
      zoom: 14,
      center: [77.5946, 12.9716],
    });

    mapRef.current = map;

    map.on("load", () => {
      console.log("TomTom map fully loaded");

      map.addSource("routeSource", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "routeLayer",
        type: "line",
        source: "routeSource",
        paint: {
          "line-color": "#007aff",
          "line-width": 6,
        },
      });

      // source + layer for a user-selected point (reporting)
      map.addSource("selectedPoint", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "selectedPointLayer",
        type: "circle",
        source: "selectedPoint",
        paint: {
          "circle-radius": 8,
          "circle-color": "#ff5500",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // click handler to let parent know where user clicked
      map.on("click", (e: any) => {
        try {
          const lngLat = e.lngLat || e.lngLat || (e && e.point) || null;
          const lat = e.lngLat?.lat;
          const lon = e.lngLat?.lng;
          if (lat != null && lon != null && typeof onMapClick === "function") {
            onMapClick({ lat, lon });
          }
        } catch (err) {
          // ignore
        }
      });
    });

    return () => map.remove();
  }, []);

  // update selectedPoint source when selectedCoords changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const source = map.getSource("selectedPoint") as any;
      if (!source) return;
      if (selectedCoords && Number.isFinite(selectedCoords.lat) && Number.isFinite(selectedCoords.lon)) {
        const feature = {
          type: "Feature",
          geometry: { type: "Point", coordinates: [selectedCoords.lon, selectedCoords.lat] },
        };
        source.setData({ type: "FeatureCollection", features: [feature] });
        // Fly a little to the selected point
        (map as any).flyTo({ center: [selectedCoords.lon, selectedCoords.lat], zoom: 16, duration: 400 });
      } else {
        source.setData({ type: "FeatureCollection", features: [] });
      }
    } catch (err) {
      // ignore until map is ready
    }
  }, [selectedCoords]);

  // --------------------------
  // APPLY ROUTE WHEN READY
  // --------------------------
  useEffect(() => {
    if (!routeData) return;
    const map = mapRef.current;
    if (!map) return;

    const applyRoute = () => {
      const source = map.getSource("routeSource") as tt.GeoJSONSource;
      if (!source) {
        console.warn("routeSource not ready yet, retrying...");
        setTimeout(applyRoute, 200);
        return;
      }

      console.log("Route applied to map");
      source.setData(routeData);
    };

    applyRoute();
  }, [routeData]);

  // --------------------------
  // FLY TO HIGHLIGHTED INCIDENT
  // --------------------------
  useEffect(() => {
    if (!highlightedIncidentId) return;
    const map = mapRef.current;
    if (!map) return;

    // search incident / hazard / police arrays
    const allCandidates = [
      ...(incidents || []),
      ...(hazards || []),
      ...(policeStations || []),
    ];

    const target = allCandidates.find((item: any) => item.id === highlightedIncidentId);
    if (!target || !target.latitude || !target.longitude) return;

    (map as any).flyTo({
      center: [target.longitude, target.latitude],
      zoom: 16,
      duration: 800,
    });
  }, [highlightedIncidentId, incidents, hazards, policeStations]);

  // --------------------------
  // RENDER
  // --------------------------
  return (
    <>
      {/* Overlays (incidents, crime, etc.) */}
      <IncidentLayer
        map={mapRef.current}
        incidents={incidents}
        crimeZones={crimeZones}
        hazards={hazards}
        policeStations={policeStations}
        highlightedIncidentId={highlightedIncidentId}
      />

      {/* Actual map container */}
      <div ref={mapDivRef} className="w-full h-full" />
    </>
  );
};

export default MapContainer;
