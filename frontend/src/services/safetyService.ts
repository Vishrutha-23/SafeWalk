// frontend/src/services/safetyService.ts

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export interface SafetyScoreResponse {
  score: number;
  nearbyIncidents: number;
  crimeZones: number;
  weatherRisk: string;
  weather?: any;
}

export const getSafetyScore = async (lat: number, lon: number) => {
  const r = await fetch(`http://localhost:3000/safety-score?lat=${lat}&lon=${lon}`);
  const data = await r.json();
  return data.score;
};


