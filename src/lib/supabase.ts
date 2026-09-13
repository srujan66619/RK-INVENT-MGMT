import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key is missing from environment variables.");
}

export const supabase = createClient(
  supabaseUrl || "https://mock.supabase.co",
  supabaseAnonKey || "mock_key"
);
