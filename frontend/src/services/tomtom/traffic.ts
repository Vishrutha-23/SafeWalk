export interface TrafficIncident {
  id: string | number;
  properties: {
    probability?: number;
    description?: string;
  };
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
}

export interface NormalizedIncident {
  id: string | number;
  severity: number;
  description: string;
  point: {
    lat: number;
    lon: number;
  };
}
