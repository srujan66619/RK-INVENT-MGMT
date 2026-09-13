import { config } from "dotenv";
config();

import { createClient } from "@supabase/supabase-js";
import { userService } from "../src/services/user.service";

async function run() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  const email = "testcust" + Date.now() + "@example.com";
  const password = "password123";

  console.log("Registering", email);
  
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: "Test Cust",
        requested_role: "customer",
        role: "user",
        approval_status: "pending"
      }
    }
  });

  if (error || !authData.user) {
    console.error("Auth error", error);
    return;
  }
  
  console.log("Auth success", authData.user.id);
  
  try {
    const profile = await userService.createProfile({
      id: authData.user.id,
      email,
      full_name: "Test Cust",
      requested_role: "customer",
      approval_status: "pending",
      role: "user",
    });
    console.log("Profile created", profile);
  } catch (e) {
    console.error("Drizzle profile error", e);
  }
  
  process.exit(0);
}

run();
