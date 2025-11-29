// src/services/crime/crime.ts

export interface CrimeIncident {
  type: string;
  severity: number;     // 1–5 scale
  timestamp: string;
  lat: number;
  lng: number;
}

export interface CrimeScoreResult {
  score: number; // 0-100 safer → better
  incidents: CrimeIncident[];
}

// ---- Dummy crime API OR you can replace with real provider ----
// We simulate crime data distributed around a location
export async function getCrimeData(lat: number, lng: number): Promise<CrimeScoreResult> {
  // Simulate 5–10 random crime incidents
  const count = Math.floor(Math.random() * 5) + 5;

  const incidents: CrimeIncident[] = Array.from({ length: count }).map(() => ({
    type: ["theft", "harassment", "assault", "vandalism"][Math.floor(Math.random() * 4)],
    severity: Math.floor(Math.random() * 5) + 1,
    timestamp: new Date().toISOString(),
    lat: lat + (Math.random() - 0.5) * 0.01,
    lng: lng + (Math.random() - 0.5) * 0.01,
  }));

  const severitySum = incidents.reduce((acc, i) => acc + i.severity, 0);

  // Higher severity → lower score
  const normalizedCrime = Math.min((severitySum / 30) * 100, 100);

  const finalScore = 100 - normalizedCrime;

  return {
    score: Math.round(finalScore),
    incidents,
  };
}
