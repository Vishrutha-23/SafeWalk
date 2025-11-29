export async function getRouteFromBackend(origin: any, destination: any) {
  const res = await fetch("http://localhost:3000/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin, destination }),
  });

  return await res.json();
}
