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

import { userService } from "@/services/user.service";

export async function requireAuth(allowedRoles?: string[]) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const profile = await userService.getProfileById(session.user.id);
  
  if (!profile || profile.approval_status !== "approved") {
    throw new Error("Account pending approval or rejected");
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    throw new Error("Unauthorized: Insufficient permissions");
  }

  return { session, user: profile };
}
