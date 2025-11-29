export interface LatLng {
  lat: number;
  lng: number;
}

export async function getRoutes(start: LatLng, end: LatLng) {
  const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;

  const url = `https://api.tomtom.com/routing/1/calculateRoute/
    ${start.lat},${start.lng}:${end.lat},${end.lng}/json?key=${apiKey}
    &computeBestOrder=true&routeType=pedestrian`;

  const cleanUrl = url.replace(/\s+/g, "");

  const res = await fetch(cleanUrl);
  if (!res.ok) throw new Error("Routing failed");
  return res.json();
}
