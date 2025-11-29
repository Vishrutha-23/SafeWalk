export const getDashboardData = async (lat: number, lon: number) => {
  const res = await fetch(`http://localhost:3000/dashboard?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error("Dashboard fetch failed");

  return await res.json();
};
