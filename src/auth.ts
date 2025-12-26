import { supabase } from "./supabase";

export async function getUserFromAuthHeader(authHeader?: string) {
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return { user: null, error: "Missing Bearer token" };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { user: null, error: "Invalid token" };

  return { user: data.user, error: null };
}
