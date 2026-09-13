import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { db } from '../src/db/index.js';
import { profiles } from '../src/db/schema/users.js';
import { eq } from 'drizzle-orm';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const email = `admin_${Date.now()}@rklabs.com`;
  const password = "Password123!";

  console.log(`Creating user: ${email}`);

  // 1. Sign up with Supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Supabase Auth error:", error.message);
    process.exit(1);
  }

  const userId = data.user?.id;
  if (!userId) {
    console.error("No user ID returned. Is Email Confirmation required in Supabase settings?");
    console.log("If so, please go to Supabase Dashboard -> Authentication -> Providers -> Email, and disable 'Confirm email'.");
    process.exit(1);
  }

  // 2. Wait a moment to ensure the trigger/frontend hasn't created the profile yet
  // Actually, we don't have a trigger, and we are not using the frontend endpoint here.
  
  // 3. Insert into Drizzle profiles manually
  try {
    await db.insert(profiles).values({
      id: userId,
      email,
      full_name: "System Admin",
      role: "admin",
      approval_status: "approved",
      requested_role: "admin"
    });
    console.log("Profile inserted!");
  } catch (e: any) {
    if (e.message?.includes('duplicate key')) {
      console.log("Profile already exists, updating it...");
      await db.update(profiles)
        .set({ role: "admin", approval_status: "approved" })
        .where(eq(profiles.id, userId));
    } else {
      console.error("Drizzle error:", e);
    }
  }

  console.log("-------------------------------------------------");
  console.log("SUCCESS! Please log in with these credentials:");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log("-------------------------------------------------");
  console.log("Note: If login says 'Invalid login credentials' or 'Email not confirmed', you MUST disable 'Confirm email' in Supabase Auth settings!");
  process.exit(0);
}

createAdmin().catch(console.error);
