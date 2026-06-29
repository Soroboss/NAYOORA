import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { activeOrganizationCookie, createClient } from "@/lib/insforge/server";

export async function getCurrentOrganizationContext() {
  const insforge = await createClient();
  const { data: { user } } = await insforge.auth.getUser();
  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const activeOrganizationId = cookieStore.get(activeOrganizationCookie)?.value;
  const { data: memberships } = await insforge
    .from("organization_members")
    .select("id,organization_id,role,status,organization:organizations(id,name,slug,organization_type,currency,country_code,email,phone)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  const list = memberships ?? [];
  if (!list.length) redirect("/onboarding");

  const membership = list.find((item: any) => item.organization_id === activeOrganizationId) ?? list[0];
  const organizationId = membership.organization_id;

  // Verification des limites de souscription
  const { data: subscription } = await insforge
    .from("saas_subscriptions")
    .select("status, plan:saas_plans(member_limit)")
    .eq("organization_id", organizationId)
    .maybeSingle();

  let isLimitReached = false;
  
  // Si le statut est past_due ou cancelled, on bloque l'accès
  if (subscription && (subscription.status === "past_due" || subscription.status === "cancelled")) {
    isLimitReached = true;
  }
  
  // Si on dépasse la limite de membres du plan
  if (!isLimitReached && subscription?.plan && typeof (subscription.plan as any).member_limit === "number") {
    const limit = (subscription.plan as any).member_limit;
    if (limit > 0) {
      const { count } = await insforge
        .from("member_profiles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "active")
        .is("deleted_at", null);
        
      if (count !== null && count > limit) {
        isLimitReached = true;
      }
    }
  }

  return { insforge, user, membership, memberships: list, subscription, isLimitReached };
}

export function canManageMembers(role: string) {
  return ["organization_admin", "president", "secretaire", "gestionnaire"].includes(role);
}
