// src/services/tomtom/search.ts
import { TOMTOM_API_KEY } from "./config";

export interface Coordinates {
  lat: number;
  lng: number;
}

export async function getCoordinatesFromSearch(query: string): Promise<Coordinates> {
  const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(query)}.json?key=${TOMTOM_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("No results found for location");
  }

  return {
    lat: data.results[0].position.lat,
    lng: data.results[0].position.lon,
  };
}
