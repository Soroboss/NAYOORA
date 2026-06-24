export const administratorRoles = ["organization_admin", "president", "secretaire", "tresorier", "gestionnaire"];

export async function getPlanLimits(insforge: any, organizationId: string) {
  const { data } = await insforge.from("saas_subscriptions").select("plan:saas_plans(name,member_limit,admin_limit,price_xof)").eq("organization_id", organizationId).maybeSingle();
  const plan = data?.plan;
  return { name: plan?.name ?? "Gratuit", memberLimit: plan?.member_limit ?? 15, adminLimit: plan?.admin_limit ?? 3, price: plan?.price_xof ?? 0 };
}
