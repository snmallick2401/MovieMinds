import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export function isUnauthorized(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message === "UNAUTHORIZED" || error.name === "UnauthorizedError")
  );
}

export async function requireUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) throw new Error("UNAUTHORIZED");
    return user;
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      throw error;
    }
    throw new Error("UNAUTHORIZED");
  }
}

export async function requireUserOrRedirect(redirectPath = "/login") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(redirectPath);
  return user;
}
