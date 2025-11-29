// frontend/src/services/incidentService.ts

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export interface TrafficIncident {
  id: string;
  latitude: number;
  longitude: number;
  type: string;
  description: string;
  severity?: number | null;
  startTime?: string | null;
  endTime?: string | null;
}

export interface CrimeZone {
  id: string;
  name: string;
  risk: "low" | "medium" | "high" | string;
  geojson: any;
}

export interface IncidentsResponse {
  traffic: TrafficIncident[];
  crime: CrimeZone[];
}
export const getNearbyIncidents = async (lat: number, lon: number, radiusKm?: number) => {
  const q = radiusKm ? `&radiusKm=${encodeURIComponent(radiusKm)}` : "";
  const r = await fetch(`http://localhost:3000/incidents?lat=${lat}&lon=${lon}${q}`);
  return r.json();
};


/**
 * Fetch traffic incidents + crime zones around a point
 */
export async function getIncidents(
  lat: number,
  lon: number,
  radiusKm?: number
): Promise<IncidentsResponse> {
  const q = radiusKm ? `&radiusKm=${encodeURIComponent(radiusKm)}` : "";
  const url = `${BACKEND_URL}/incidents?lat=${lat}&lon=${lon}${q}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Incidents fetch failed: ${text || res.statusText}`);
  }

  const data = (await res.json()) as IncidentsResponse;

  return {
    traffic: data.traffic || [],
    crime: data.crime || [],
  };
}
