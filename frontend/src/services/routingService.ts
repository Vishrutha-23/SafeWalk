export async function getRouteFromBackend(origin: any, destination: any) {
  const res = await fetch("http://localhost:3000/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin, destination }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Route fetch failed: ${res.status}`);
  }

  return await res.json();
}
