export async function getRouteFromBackend(origin, destination) {
  const response = await fetch("http://localhost:3000/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin, destination }),
  });

  return await response.json();
}
