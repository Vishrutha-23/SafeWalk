// frontend/src/components/Map/MapContainer.tsx
import { useEffect, useRef, useState } from "react";
import tt from "@tomtom-international/web-sdk-maps";
import useLiveLocation from "@/hooks/useLiveLocation";
import IncidentLayer from "./IncidentLayer";

interface MapContainerProps {
  enableTracking: boolean;
  autoCenter: boolean;
  routeData?: any;
}

const MapContainer: React.FC<MapContainerProps> = ({
  enableTracking,
  autoCenter,
  routeData,
}) => {
  const mapRef = useRef<tt.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);

  const [trafficIncidents, setTrafficIncidents] = useState([]);
  const [crimeZones, setCrimeZones] = useState([]);

  useLiveLocation({ mapRef, enableTracking, autoCenter });

  // --------------------------
  // MAP LOAD + ROUTE LAYER
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
    });

    return () => map.remove();
  }, []);

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

  // ----------------------------------------------------
  // ⭐⭐ PASTE YOUR FETCH INCIDENTS FUNCTION HERE ⭐⭐
  // ----------------------------------------------------
// ----------------------------------------------------
// ⭐ CORRECTED TOMTOM INCIDENTS API FUNCTION ⭐
// ----------------------------------------------------
const fetchIncidents = async () => {
  const key = import.meta.env.VITE_TOMTOM_API_KEY;

  const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${key}&bbox=77.3,12.7,77.8,13.2&fields=incidents&language=en-GB`;

  const r = await fetch(url);

  if (!r.ok) {
    console.error("Traffic API failed", await r.text());
    return;
  }

  const data = await r.json();

  const parsed =
    data.incidents?.map((inc: any) => ({
      latitude: inc.geometry?.center?.lat,
      longitude: inc.geometry?.center?.lng,
      type: inc.properties?.iconCategory ?? "Incident",
      description: inc.properties?.description ?? "No description",
    })) || [];

  setTrafficIncidents(parsed);
};



  // ----------------------------------------------------

  // CALL INCIDENT API AFTER MAP LOAD
  useEffect(() => {
    fetchIncidents();

    // dummy crime zone
    setCrimeZones([
      {
        name: "High Crime Zone",
        geojson: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [77.5805, 12.9752],
                [77.5835, 12.9752],
                [77.5835, 12.9785],
                [77.5805, 12.9785],
                [77.5805, 12.9752],
              ],
            ],
          },
        },
      },
    ]);
  }, []);

  // ------------------------------
  // RENDER MAP + INCIDENT LAYER
  // ------------------------------
  return (
    <>
      <IncidentLayer
        map={mapRef.current}
        trafficIncidents={trafficIncidents}
        crimeZones={crimeZones}
      />

      <div ref={mapDivRef} className="w-full h-full" />
    </>
  );
};

export default MapContainer;
