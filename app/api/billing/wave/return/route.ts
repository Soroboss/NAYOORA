import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/insforge/server";
import { reconcileSaasWaveTransaction } from "@/lib/saas-billing";
import { retrieveWaveCheckout } from "@/lib/wave";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const transactionId = url.searchParams.get("transaction");
  const origin = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ? process.env.NEXT_PUBLIC_APP_URL : url.origin;
  let invoiceId = "";
  let status = "failed";
  try {
    const client = await createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user || !transactionId) throw new Error("Session invalide");
    const admin = await createAdminClient();
    const { data: transaction } = await admin.from("saas_payment_transactions").select("id,organization_id,invoice_id,provider_reference").eq("id", transactionId).maybeSingle();
    if (!transaction?.provider_reference) throw new Error("Transaction introuvable");
    const { data: organization } = await client.from("organizations").select("id").eq("id", transaction.organization_id).eq("created_by", user.id).maybeSingle();
    if (!organization) throw new Error("Accès refusé");
    invoiceId = transaction.invoice_id;
    status = await reconcileSaasWaveTransaction(transaction.id, await retrieveWaveCheckout(transaction.provider_reference));
  } catch {}
  const destination = new URL("/billing/checkout", origin);
  if (invoiceId) destination.searchParams.set("invoice", invoiceId);
  destination.searchParams.set("payment", status);
  return NextResponse.redirect(destination);
}
