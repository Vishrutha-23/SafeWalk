export const geocodeText = async (query: string) => {
  const key = import.meta.env.VITE_TOMTOM_API_KEY;

  const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(
    query
  )}.json?key=${key}&limit=1`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("Location not found");
  }

  const pos = data.results[0].position;

  // Return `lon` (not `lng`) so it matches backend naming (`origin.lon`)
  return {
    lat: pos.lat,
    lon: pos.lon,
  };
};
