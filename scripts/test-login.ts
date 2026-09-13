import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log("Attempting login...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "admin_1789287202704@rklabs.com",
    password: "Password123!"
  });

  if (error) {
    console.error("Login failed:", error.message, error.status);
    process.exit(1);
  }

  console.log("Login successful! User ID:", data.user?.id);
  process.exit(0);
}

testLogin().catch(console.error);
