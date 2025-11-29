import { useEffect } from "react";
import * as tt from "@tomtom-international/web-sdk-maps";

export const useRouteOnMap = (
  mapRef: React.MutableRefObject<tt.Map | null>,
  routeGeoJson: GeoJSON.FeatureCollection | null
) => {

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !routeGeoJson) return;

    // Remove previous route layer/source
    if (map.getLayer("route-line")) map.removeLayer("route-line");
    if (map.getSource("route-line")) map.removeSource("route-line");

    // Add new route GeoJSON
    map.addSource("route-line", {
      type: "geojson",
      data: routeGeoJson,
    });

    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route-line",
      paint: {
        "line-color": "#0066FF",
        "line-width": 6,
        "line-opacity": 0.9,
      },
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
    });

    return () => {
      if (map.getLayer("route-line")) map.removeLayer("route-line");
      if (map.getSource("route-line")) map.removeSource("route-line");
    };
  // 👇 CORRECT FIX — ignore mapRef on purpose
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeGeoJson]);
};
