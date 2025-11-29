import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { getIncidents } from "@/services/incidentService";
import { getSafetyScore } from "@/services/safetyService";
import { getRouteFromBackend } from "@/services/routingService";

interface OnTripProps {
  origin: { lat: number; lon: number };
  destination: { lat: number; lon: number };
  routeData: any; // GeoJSON
  mapRef?: any;
  onReroute?: (newRoute: any) => void;
  onStop?: () => void;
}

function distanceMeters(lat1:number, lon1:number, lat2:number, lon2:number){
  const toRad = (v:number)=> (v*Math.PI)/180;
  const R = 6371000;
  const dLat = toRad(lat2-lat1);
  const dLon = toRad(lon2-lon1);
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
  const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R*c;
}

const OnTrip: React.FC<OnTripProps> = ({ origin, destination, routeData, mapRef, onReroute, onStop }) => {
  const [position, setPosition] = useState<{lat:number, lon:number} | null>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [safety, setSafety] = useState<number | null>(null);
  const [lowLight, setLowLight] = useState(false);
  const [suggestReroute, setSuggestReroute] = useState(false);
  const seenIncidentsRef = useRef<Set<string>>(new Set());
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // start geolocation watch
    if (navigator.geolocation && !watchIdRef.current) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        (err) => console.warn("OnTrip geolocation error:", err),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 5000 }
      );
      // @ts-ignore
      watchIdRef.current = id;
    }

    return () => {
      if (watchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current as number);
      }
    };
  }, []);

  useEffect(() => {
    // polling for incidents + safety score
    let cancelled = false;
    const check = async () => {
      try {
        if (!position) return;
        // incidents
        const data: any = await getIncidents(position.lat, position.lon).catch(() => ({ traffic: [], crime: [] }));
        const traffic = data.traffic || [];
        // mark new incidents
        const newOnes: any[] = [];
        for (const t of traffic) {
          const id = t.id ?? `${t.latitude},${t.longitude}`;
          if (!seenIncidentsRef.current.has(id)) {
            seenIncidentsRef.current.add(id);
            // distance check
            const d = distanceMeters(position.lat, position.lon, t.latitude, t.longitude);
            if (d < 500) newOnes.push({ ...t, distance: d });
          }
        }
        if (!cancelled) setIncidents((prev) => [...newOnes, ...prev].slice(0, 20));

        // safety score
        const s: any = await getSafetyScore(position.lat, position.lon).catch(() => null);
        if (!cancelled) setSafety(typeof s === "number" ? s : null);

        // low-light detect (simple): night hours
        const h = new Date().getHours();
        const isLow = h < 6 || h >= 18;
        if (!cancelled) setLowLight(isLow);

        // decide reroute suggestion
        const risk = (s && typeof s === 'number') ? s : 100;
        if (risk < 60 || (isLow && risk < 80)) {
          setSuggestReroute(true);
        } else {
          setSuggestReroute(false);
        }
      } catch (err) {
        console.error("OnTrip polling error:", err);
      }
    };

    const iv = setInterval(check, 8000);
    // run immediately
    check();

    return () => { cancelled = true; clearInterval(iv); };
  }, [position]);

  const handleReroute = async () => {
    try {
      if (!position) return;
      // call backend route using current pos as origin
      const newRoute = await getRouteFromBackend({ lat: position.lat, lon: position.lon }, destination);
      // choose safest
      const safest = newRoute.safest || newRoute.safest;
      if (safest && onReroute) onReroute(safest.geojson);
      setSuggestReroute(false);
    } catch (err) {
      console.error("Reroute failed:", err);
      alert("Re-route failed: " + (err as any).message);
    }
  };

  return (
    <div className="absolute bottom-6 left-6 z-50 w-96 p-4 bg-white rounded shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">On‑Trip Live</h3>
        <div>
          <button onClick={() => { if (onStop) onStop(); }} className="px-2 py-1 text-sm">Stop</button>
        </div>
      </div>

      <div className="text-sm mb-2">
        <div>Position: {position ? `${position.lat.toFixed(5)}, ${position.lon.toFixed(5)}` : "Waiting for GPS..."}</div>
        <div>Safety score: {safety ?? "-"}</div>
        <div>Low light: {lowLight ? "Yes" : "No"}</div>
      </div>

      {incidents.length > 0 && (
        <div className="mb-2">
          <div className="font-medium">Nearby incidents</div>
          <ul className="text-sm list-disc ml-4 max-h-32 overflow-y-auto">
            {incidents.map((i, idx) => (
              <li key={i.id ?? idx}>{i.type} • {Math.round(i.distance)}m • {i.description ?? ''}</li>
            ))}
          </ul>
        </div>
      )}

      {suggestReroute && (
        <div className="flex gap-2">
          <Button onClick={handleReroute}>We found a safer alternative — Re‑route</Button>
          <Button variant="outline" onClick={() => setSuggestReroute(false)}>Ignore</Button>
        </div>
      )}
    </div>
  );
};

export default OnTrip;
