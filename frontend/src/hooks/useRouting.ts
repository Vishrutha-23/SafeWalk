import { getRoutes, LatLng } from "../services/tomtom/routing";
import { useState } from "react";

export function useRouting() {
  const [routes, setRoutes] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  async function calculate(start: LatLng, end: LatLng) {
    setLoading(true);
    try {
      const data = await getRoutes(start, end);
      setRoutes(data.routes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return { routes, loading, calculate };
}
