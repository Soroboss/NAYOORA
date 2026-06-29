import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/insforge/server";

const providers = new Set(["wave", "orange_money"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reference = String(body.reference || "").trim();
    const client = await createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    if (!body.invoiceId || !providers.has(body.provider) || reference.length < 4) return NextResponse.json({ error: "Fournisseur et référence requis." }, { status: 400 });

    const admin = await createAdminClient();
    const { data: invoice } = await admin.from("saas_invoices").select("id,organization_id,tenant_id,subscription_id,amount,status").eq("id", body.invoiceId).maybeSingle();
    if (!invoice) return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
    const { data: organization } = await client.from("organizations").select("id").eq("id", invoice.organization_id).eq("created_by", user.id).maybeSingle();
    if (!organization) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

    const { error } = await admin.from("saas_payment_transactions").insert({
      organization_id: invoice.organization_id,
      tenant_id: invoice.tenant_id,
      invoice_id: invoice.id,
      subscription_id: invoice.subscription_id,
      provider: body.provider,
      amount: Number(invoice.amount),
      currency: "XOF",
      status: "pending",
      provider_reference: reference,
      metadata: { declared_by_tenant: true, destination_phone: "+2250757228731" },
    });
    if (error) return NextResponse.json({ error: String(error.message || "").toLowerCase().includes("unique") ? "Cette référence a déjà été déclarée." : error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Déclaration impossible." }, { status: 500 });
  }
}
