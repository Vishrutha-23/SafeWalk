// src/services/tomtom/alerts.ts
export interface TrafficIncidentPoint {
  lat: number;
  lon: number;
}

export interface TrafficIncident {
  id: string;
  severity: number;
  description: string;
  point: TrafficIncidentPoint;
}

interface TomTomIncidentProperties {
  probability?: number;
  description?: string;
}

interface TomTomIncidentGeometry {
  coordinates: [number, number]; // [lon, lat]
}

interface TomTomIncidentRaw {
  id: string;
  properties: TomTomIncidentProperties;
  geometry: TomTomIncidentGeometry;
}

interface TomTomIncidentResponse {
  incidents?: TomTomIncidentRaw[];
}

export async function getTrafficAlertsAround(
  lat: number,
  lon: number
): Promise<TrafficIncident[]> {

  const bbox = `${lon - 0.05},${lat - 0.05},${lon + 0.05},${lat + 0.05}`;

  const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${
    import.meta.env.VITE_TOMTOM_API_KEY
  }&bbox=${bbox}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error("Traffic alerts API error:", res.status, res.statusText);
    return [];
  }

  const json: TomTomIncidentResponse = await res.json();
  const incidents = json.incidents ?? [];

  return incidents.map((item): TrafficIncident => {
    const [lng, lat] = item.geometry.coordinates;

    return {
      id: item.id,
      severity: item.properties.probability ?? 0,
      description: item.properties.description ?? "No description",
      point: { lat, lon: lng },
    };
  });
}
