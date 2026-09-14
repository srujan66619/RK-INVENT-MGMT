"use server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient, getSession } from "../auth.server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  requestedRole: z.enum(["customer", "employee", "admin"]).default("customer"),
});

export const loginFn = createServerFn({ method: "POST" })
  .validator((data) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return { error: error.message || "Invalid credentials" };
    }

    const authUser = authData.user;
    
    const { userService } = await import("@/services/user.service");
    let profile = await userService.getProfileById(authUser.id);
    if (!profile) {
      console.warn("Profile not found for authenticated user. Attempting auto-heal...");
      try {
        profile = await userService.createProfile({
          id: authUser.id,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name || authUser.email!.split("@")[0],
          requested_role: authUser.user_metadata?.requested_role || "user",
          role: authUser.user_metadata?.role || "user",
          approval_status: authUser.user_metadata?.approval_status || "pending",
        });
      } catch (e) {
        return { error: "Profile not found in database and auto-recovery failed." };
      }
    }

    if (!profile) {
      return { error: "Profile not found in database." };
    }

    if (profile.approval_status !== "approved") {
      return { 
        error: profile.approval_status === "pending"
          ? "Your account is pending admin approval."
          : "Your account was not approved. Please contact the shop admin."
      };
    }

    return { success: true, user: { id: profile.id, email: profile.email, role: profile.role } };
  });

export const registerFn = createServerFn({ method: "POST" })
  .validator((data) => registerSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    
    const { userService } = await import("@/services/user.service");
    const profileCount = await userService.countProfiles();
    const isFirstUser = profileCount === 0;
    
    const role = isFirstUser ? "admin" : "user";
    const approval_status = isFirstUser ? "approved" : "pending";

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          requested_role: data.requestedRole,
          role,
          approval_status
        }
      }
    });

    if (error || !authData.user) {
      throw new Error(error?.message || "Failed to register");
    }

    try {
      await userService.createProfile({
        id: authData.user.id,
        email: data.email,
        full_name: data.fullName,
        requested_role: data.requestedRole,
        approval_status,
        role,
      });
    } catch (e) {
      console.warn("Failed to insert profile, it might already exist or Drizzle insert failed", e);
    }

    return { success: true, status: approval_status };
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  await supabase.auth.signOut();
  return { success: true };
});

export const meFn = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession();
  if (!session) return { user: null };

  const authUser = session.user;
  
  const { userService } = await import("@/services/user.service");
  // Fetch fresh profile from Drizzle
  const profile = await userService.getProfileById(authUser.id);
  if (!profile) return { user: null };
  
  // If not approved, treat as not logged in for the frontend navigation,
  // allowing the auth page to show the "pending" or "rejected" states.
  if (profile.approval_status !== "approved") {
    return { user: null };
  }
  
  return {
    user: {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      approval_status: profile.approval_status,
      requested_role: profile.requested_role,
      full_name: profile.full_name,
    },
  };
});
