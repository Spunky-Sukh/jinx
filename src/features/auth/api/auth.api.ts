import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/db";

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/**
 * In-app password change. Supabase has no "verify current password" call, so we
 * re-authenticate with the current password first (which also refreshes the
 * session) and only then set the new one. Throws if the current password is wrong.
 */
export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string
) {
  const { error: verifyErr } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (verifyErr) throw new Error("Current password is incorrect");
  await updatePassword(newPassword);
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null; // no row
    throw error;
  }
  return data as Profile;
}
