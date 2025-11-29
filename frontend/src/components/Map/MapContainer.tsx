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

  // LIVE USER LOCATION
  useLiveLocation({ mapRef, enableTracking, autoCenter });


  /* ---------------------------------------------
      INITIAL MAP SETUP
  --------------------------------------------- */
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

      // Create source for route
      map.addSource("routeSource", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      // Route Layer
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


  /* ---------------------------------------------
      APPLY ROUTE WHEN routeData CHANGES
  --------------------------------------------- */
  useEffect(() => {
    if (!routeData) return;
    const map = mapRef.current;
    if (!map) return;

    const tryApplyRoute = () => {
      const src = map.getSource("routeSource") as tt.GeoJSONSource;

      if (!src) {
        console.warn("routeSource not ready yet, retrying…");
        return setTimeout(tryApplyRoute, 200);
      }

      console.log("Route applied to map");
      src.setData(routeData);
    };

    tryApplyRoute();
  }, [routeData]);


  /* ---------------------------------------------
      FETCH LIVE TRAFFIC INCIDENTS (ONLY ONCE)
  --------------------------------------------- */
  useEffect(() => {
    const fetchIncidents = async () => {
      const key = import.meta.env.VITE_TOMTOM_API_KEY;

      const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${key}&bbox=12.7,77.3,13.2,77.8&fields=type,geometry,properties`;

      try {
        const r = await fetch(url);
        const data = await r.json();

        const parsed = data.incidents?.map((inc: any) => ({
          latitude: inc.geometry?.center?.lat,
          longitude: inc.geometry?.center?.lng,
          type: inc.properties?.iconCategory || "Incident",
          description: inc.properties?.description,
        }));

        setTrafficIncidents(parsed);
      } catch (err) {
        console.error("Traffic incident fetch failed:", err);
      }
    };

    fetchIncidents();
  }, []); // IMPORTANT: prevents infinite loop


  /* ---------------------------------------------
      LOAD CRIME ZONES (STATIC)
  --------------------------------------------- */
  useEffect(() => {
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


  return (
    <>
      {/* INCIDENT + CRIME LAYER */}
      <IncidentLayer
        map={mapRef.current}
        trafficIncidents={trafficIncidents}
        crimeZones={crimeZones}
      />

      {/* MAP */}
      <div ref={mapDivRef} className="w-full h-full" />
    </>
  );
};

export default MapContainer;
