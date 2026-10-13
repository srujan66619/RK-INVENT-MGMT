import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";

const getSupabaseCredentials = () => {
  const url =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const key =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  return { url, key };
};

export function getSupabaseServerClient() {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    console.warn("Supabase credentials missing: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not configured.");
    return null;
  }

  return createServerClient(url, key, {
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
  if (!supabase) return null;

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

  const { userService } = await import("@/services/user.service");
  const profile = await userService.getProfileById(session.user.id);
  
  if (!profile || profile.approval_status !== "approved") {
    throw new Error("Account pending approval or rejected");
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    throw new Error("Unauthorized: Insufficient permissions");
  }

  return { session, user: profile };
}
