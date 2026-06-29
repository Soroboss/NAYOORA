import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/insforge/server";
import { createWaveCheckout } from "@/lib/wave";

export async function POST(request: Request) {
  try {
    const { invoiceId } = await request.json();
    const client = await createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });

    const admin = await createAdminClient();
    const { data: invoice } = await admin.from("saas_invoices").select("id,organization_id,tenant_id,subscription_id,amount,currency,status").eq("id", invoiceId).maybeSingle();
    if (!invoice) return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
    const { data: organization } = await client.from("organizations").select("id,created_by").eq("id", invoice.organization_id).eq("created_by", user.id).maybeSingle();
    if (!organization) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    if (invoice.status === "paid") return NextResponse.json({ error: "Cette facture est déjà payée." }, { status: 400 });

    const amount = Math.round(Number(invoice.amount));
    const { data: transaction, error: transactionError } = await admin.from("saas_payment_transactions").insert({
      organization_id: invoice.organization_id,
      tenant_id: invoice.tenant_id,
      invoice_id: invoice.id,
      subscription_id: invoice.subscription_id,
      provider: "wave",
      amount,
      currency: "XOF",
      status: "created",
    }).select("id").single();
    if (transactionError || !transaction) throw transactionError || new Error("Transaction impossible.");

    const origin = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ? process.env.NEXT_PUBLIC_APP_URL : new URL(request.url).origin;
    const returnUrl = `${origin}/api/billing/wave/return?transaction=${encodeURIComponent(transaction.id)}`;
    const checkout = await createWaveCheckout({
      amount,
      intentId: transaction.id,
      clientReference: `nayoora-saas:${transaction.id}`,
      successUrl: `${returnUrl}&result=success`,
      errorUrl: `${returnUrl}&result=error`,
    });
    await admin.from("saas_payment_transactions").update({ status: "pending", provider_reference: checkout.id, checkout_url: checkout.wave_launch_url, updated_at: new Date().toISOString() }).eq("id", transaction.id);
    return NextResponse.json({ checkoutUrl: checkout.wave_launch_url, amount });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Paiement Wave indisponible." }, { status: 500 });
  }
}
