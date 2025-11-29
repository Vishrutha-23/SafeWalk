import { useEffect, useRef } from "react";
import * as tt from "@tomtom-international/web-sdk-maps";

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  heading?: number | null;
}

interface UseLiveLocationProps {
  mapRef: React.MutableRefObject<tt.Map | null>;
  enableTracking: boolean;
  autoCenter: boolean;
}

const useLiveLocation = ({ mapRef, enableTracking, autoCenter }: UseLiveLocationProps) => {
  const markerRef = useRef<tt.Marker | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    
    if (!enableTracking || !map) return;

    const watchId = navigator.geolocation.watchPosition(
  (pos) => {
    console.log("🔵 Raw Position object:", pos);
    console.log("   ➜ latitude :", pos.coords.latitude);
    console.log("   ➜ longitude:", pos.coords.longitude);
    console.log("   ➜ accuracy :", pos.coords.accuracy);
    console.log("   ➜ heading  :", pos.coords.heading);

    const coords: UserLocation = {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    heading: pos.coords.heading ?? 0,
};
if (
  coords.lat === null ||
  coords.lng === null ||
  Number.isNaN(coords.lat) ||
  Number.isNaN(coords.lng)
) {
  console.warn("Skipping invalid coordinates: ", coords);
  return;
}
    /** Create marker once */
if (!markerRef.current) {
    const el = document.createElement("div");
    el.className = "live-location-dot";

    markerRef.current = new tt.Marker({ element: el })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map);
} else {
    markerRef.current.setLngLat([coords.lng, coords.lat]);
}


    // (we’ll add more here in Step 4)
    // ❗ SAFETY CHECK – if lat/lng is missing, don't update map
// SAFETY CHECK — Only update if valid coordinates exist
if (autoCenter && map) {
  map.easeTo({
    center: [coords.lng, coords.lat],
    zoom: 17,
    duration: 600,
  });
}


  },
  (err) => console.error("Geo error:", err),
  {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000,
}

);


    return () => navigator.geolocation.clearWatch(watchId);
  }, [enableTracking, autoCenter, mapRef]);
};

export default useLiveLocation;
