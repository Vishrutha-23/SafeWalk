import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey: string = import.meta.env.VITE_SUPABASE_PUBLIC_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase env vars missing in .env");
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

export default supabase;
