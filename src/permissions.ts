import { supabase } from "./supabase";

export async function requireUser(authHeader?: string) {
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return {
      ok: false as const,
      status: 401,
      error: "Missing Bearer Token",
      user: null,
    };
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return {
      ok: false as const,
      status: 401,
      error: "Invalid token",
      user: null,
    };
  }

  return {
    ok: true as const,
    status: 200,
    error: null,
    user: data.user,
  };
}

export async function requireSpaceOwner(
  spacesId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from("spaces")
    .select("spaces_id, profiles_id")
    .eq("spaces_id", spacesId)
    .single();

  if (error || !data) {
    return {
      ok: false as const,
      status: 404,
      error: "Space not found",
    };
  }

  if (data.profiles_id !== userId) {
    return {
      ok: false as const,
      status: 403,
      error: "Forbidden: not space owner",
    };
  }

  return {
    ok: true as const,
    status: 200,
    error: null,
  };
}