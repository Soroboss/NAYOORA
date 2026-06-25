import { createClient } from "@/lib/insforge/server";

type AuthDestination = "/platform" | "/dashboard" | "/onboarding";

export async function getAuthDestination(accessToken?: string): Promise<AuthDestination> {
  const insforge = await createClient(accessToken);
  const { data: { user } } = await insforge.auth.getUser();
  if (!user) return "/onboarding";

  const { data: platformAdmin } = await insforge
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (platformAdmin) return "/platform";

  const { data: membership } = await insforge
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return membership ? "/dashboard" : "/onboarding";
}
