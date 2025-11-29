import { getCrimeData } from "@/services/crime/crime";

// ---------- Types ----------
interface TomTomIncident {
  severity?: number;
  type?: string;
}

interface TomTomTrafficResponse {
  incidents?: TomTomIncident[];
}

export interface SafetyScoreResult {
  score: number;
  trafficRisk: number;
  crimeRisk: number;
}

// ---------- Main Function ----------
export async function calculateSafetyScore(
  lat: number,
  lng: number
): Promise<SafetyScoreResult> {
  // -------- Traffic Safety (TomTom Incidents) --------
  const trafficUrl = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${
    import.meta.env.VITE_TOMTOM_API_KEY
  }&bbox=${lng - 0.02},${lat - 0.02},${lng + 0.02},${
    lat + 0.02
  }&fields={incidents{type,severity}}`;

  let trafficRisk = 0;

  try {
    const response = await fetch(trafficUrl);
    const data: TomTomTrafficResponse = await response.json();

    const incidents = data.incidents ?? [];

    const severitySum = incidents.reduce((acc, i) => {
      const sev = typeof i.severity === "number" ? i.severity : 1;
      return acc + sev;
    }, 0);

    trafficRisk = Math.min((severitySum / 25) * 100, 100);
  } catch (err) {
    console.error("Traffic API error:", err);
  }

  // -------- Crime Safety (Your own Supabase or API) --------
  let crimeRisk = 0;

  try {
    const crime = await getCrimeData(lat, lng);
    crimeRisk = 100 - crime.score; // Convert "safety" → "risk"
  } catch (err) {
    console.error("Crime API error:", err);
  }

  // -------- Weighted Final Score --------
  const finalScore = Math.round(
    100 - (trafficRisk * 0.6 + crimeRisk * 0.4)
  );

  return {
    score: finalScore,
    trafficRisk,
    crimeRisk,
  };
}
