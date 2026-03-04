import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppRole = "owner" | "admin" | "staff";

export async function requireAuth(allowedRoles?: AppRole[]) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, clinic_id, role")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    redirect("/dashboard?error=forbidden");
  }

  return { user, profile, supabase };
}
