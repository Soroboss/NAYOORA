import { NextResponse } from "next/server";
import { getCurrentOrganizationContext } from "@/lib/current-organization";

export async function POST(request: Request) {
  try {
    const { planId } = await request.json();
    if (!planId) return NextResponse.json({ error: "Offre requise." }, { status: 400 });
    const { insforge, membership } = await getCurrentOrganizationContext();
    if (!['organization_admin', 'president'].includes(membership.role)) return NextResponse.json({ error: "Seul un responsable peut changer l’abonnement." }, { status: 403 });
    const organizationId = membership.organization_id;
    const [{ data: subscription }, { data: plan }] = await Promise.all([
      insforge.from("saas_subscriptions").select("id,plan_id,plan:saas_plans(price_xof)").eq("organization_id", organizationId).maybeSingle(),
      insforge.from("saas_plans").select("id,code,name,price_xof,active").eq("id", planId).eq("active", true).maybeSingle(),
    ]);
    if (!subscription || !plan) return NextResponse.json({ error: "Abonnement ou offre introuvable." }, { status: 404 });
    if (subscription.plan_id === plan.id || Number(plan.price_xof) <= Number((subscription.plan as any)?.price_xof || 0)) return NextResponse.json({ error: "Choisissez une offre supérieure à votre offre actuelle." }, { status: 400 });
    const { data: existing } = await insforge.from("saas_invoices").select("id").eq("organization_id", organizationId).eq("plan_id", plan.id).eq("status", "open").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (existing) return NextResponse.json({ invoiceId: existing.id });
    const { data: invoice, error } = await insforge.from("saas_invoices").insert({
      organization_id: organizationId,
      tenant_id: organizationId,
      subscription_id: subscription.id,
      plan_id: plan.id,
      amount: Number(plan.price_xof),
      currency: "XOF",
      status: "open",
      due_at: new Date().toISOString().slice(0, 10),
    }).select("id").single();
    if (error || !invoice) throw error || new Error("Facture impossible.");
    await insforge.from("access_logs").insert({ organization_id: organizationId, event_type: "subscription_upgrade_requested", metadata: { plan_id: plan.id, plan_code: plan.code, invoice_id: invoice.id } });
    return NextResponse.json({ invoiceId: invoice.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upgrade impossible." }, { status: 400 });
  }
}
