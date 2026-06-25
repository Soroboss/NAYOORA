import { createClient } from "@/lib/insforge/server";

export type PublicPlan = {
  id: string;
  code: string;
  name: string;
  price_xof: number;
  member_limit: number | null;
  admin_limit: number | null;
  features: string[];
};

const fallbackPlans: PublicPlan[] = [
  { id: "free", code: "free", name: "Gratuit", price_xof: 0, member_limit: 15, admin_limit: 3, features: ["Membres, cotisations & messages"] },
  { id: "standard", code: "standard", name: "Croissance", price_xof: 6500, member_limit: 50, admin_limit: 5, features: ["Finances, événements & rapports"] },
  { id: "unlimited", code: "unlimited", name: "Illimitée", price_xof: 12700, member_limit: null, admin_limit: null, features: ["Tous les modules NAYOORA"] },
];

export async function getPublicPlans(): Promise<PublicPlan[]> {
  try {
    const insforge = await createClient();
    const { data } = await insforge.from("saas_plans").select("id,code,name,price_xof,member_limit,admin_limit,features").eq("active", true).order("price_xof");
    if (data?.length) return data.map((plan: any) => ({ ...plan, price_xof: Number(plan.price_xof ?? 0), features: Array.isArray(plan.features) ? plan.features : [] }));
  } catch {}
  return fallbackPlans;
}

export function planLimits(plan: PublicPlan) {
  const admins = plan.admin_limit === null ? "Administrateurs illimités" : `Jusqu’à ${plan.admin_limit} administrateurs`;
  const members = plan.member_limit === null ? "Membres illimités" : `Jusqu’à ${plan.member_limit} membres`;
  return [admins, members, ...plan.features];
}

export function planPrice(plan: PublicPlan) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(plan.price_xof);
}
