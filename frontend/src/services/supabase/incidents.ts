import supabase from "./client";

export interface IncidentInput {
  type: string;
  description: string;
  latitude: number;
  longitude: number;
}

export interface Incident {
  id: string;
  user_id: string | null;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

// INSERT INCIDENT
export async function createIncident(payload: IncidentInput) {
  const { data, error } = await supabase.from("incidents").insert([
    {
      type: payload.type,
      description: payload.description,
      latitude: payload.latitude,
      longitude: payload.longitude,
    },
  ]);

  if (error) {
    console.error("Error creating incident:", error);
    throw error;
  }

  return data;
}

// FETCH INCIDENTS
export async function fetchIncidents(): Promise<Incident[]> {
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .order("timestamp", { ascending: false });

  if (error) {
    console.error("Error fetching incidents:", error);
    throw error;
  }

  return data as Incident[];
}
