import { NextResponse } from "next/server";
import { getCurrentOrganizationContext } from "@/lib/current-organization";

export async function GET() {
  const { insforge, membership } = await getCurrentOrganizationContext();
  const { data: subscription } = await insforge.from("saas_subscriptions")
    .select("plan_id,plan:saas_plans(id,code,name,price_xof,member_limit,admin_limit)")
    .eq("organization_id", membership.organization_id)
    .maybeSingle();
  const currentPlan = subscription?.plan as any;
  const { data: allPlans, error } = await insforge.from("saas_plans")
    .select("id,code,name,price_xof,member_limit,admin_limit")
    .eq("active", true)
    .order("price_xof", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const plans = (allPlans || []).filter((plan: any) => plan.id !== subscription?.plan_id && Number(plan.price_xof) > Number(currentPlan?.price_xof || 0));
  return NextResponse.json({ currentPlan, plans });
}
