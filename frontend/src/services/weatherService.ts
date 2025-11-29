// frontend/src/services/weatherService.ts

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export interface WeatherData {
  temp?: number;
  feelsLike?: number;
  humidity?: number;
  description?: string;
  icon?: string;
  visibility?: number;
  windSpeed?: number;
  raw?: any;
}
export const getWeatherAtLocation = async (lat: number, lon: number) => {
  const r = await fetch(`http://localhost:3000/weather?lat=${lat}&lon=${lon}`);
  return r.json();
};


export async function getWeather(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const url = `${BACKEND_URL}/weather?lat=${lat}&lon=${lon}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Weather fetch failed: ${text || res.statusText}`);
  }

  return (await res.json()) as WeatherData;
}
