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
  return { insforge, user, membership, memberships: list };
}

export function canManageMembers(role: string) {
  return ["organization_admin", "president", "secretaire", "gestionnaire"].includes(role);
}
