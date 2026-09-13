import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

export function getSupabaseServerClient() {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return getCookie(name);
      },
      set(name: string, value: string, options: any) {
        setCookie(name, value, {
          ...options,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
      },
      remove(name: string, options: any) {
        deleteCookie(name);
      },
    },
  });
}

export async function getSession() {
  const supabase = getSupabaseServerClient();
  // Validate the user token securely via the Supabase Auth server
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;
  
  // We still return the session object since the app relies on it
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  
  return session;
}

export async function requireAuth(allowedRoles?: string[]) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Optional: Add logic to check custom roles in the user metadata or from a users table
  // For now, if logged in, we return the session.
  return { session, user: session.user };
}
