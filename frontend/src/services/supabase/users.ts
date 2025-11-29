import supabase from "./client";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

// GET USER BY ID
export async function getUser(id: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching user:", error);
    return null;
  }

  return data as UserProfile;
}

// CREATE USER (If needed later)
export async function createUser(user: {
  id: string;
  name: string;
  email: string;
}) {
  const { data, error } = await supabase.from("users").insert([
    {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  ]);

  if (error) {
    console.error("Error creating user:", error);
    throw error;
  }

  return data;
}
