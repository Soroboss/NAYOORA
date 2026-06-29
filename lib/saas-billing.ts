import { createAdminClient } from "@/lib/insforge/server";
import type { WaveCheckout } from "@/lib/wave";

export async function reconcileSaasWaveTransaction(transactionId: string, checkout: WaveCheckout) {
  const database = await createAdminClient();
  const { data: transaction } = await database.from("saas_payment_transactions")
    .select("id,organization_id,tenant_id,invoice_id,subscription_id,amount,status,provider_reference")
    .eq("id", transactionId)
    .eq("provider", "wave")
    .maybeSingle();
  if (!transaction || transaction.provider_reference !== checkout.id) throw new Error("Transaction d’abonnement introuvable.");

  if (checkout.payment_status !== "succeeded") {
    const status = checkout.checkout_status === "expired" ? "expired" : checkout.payment_status === "cancelled" ? "cancelled" : "pending";
    await database.from("saas_payment_transactions").update({ status, updated_at: new Date().toISOString() }).eq("id", transaction.id);
    return status;
  }
  if (transaction.status === "succeeded") return "succeeded";

  const { data: invoice } = await database.from("saas_invoices").select("id,amount,status,plan_id").eq("id", transaction.invoice_id).eq("organization_id", transaction.organization_id).maybeSingle();
  if (!invoice || Number(invoice.amount) !== Number(transaction.amount) || Number(checkout.amount) !== Number(transaction.amount)) {
    throw new Error("Le montant payé ne correspond pas à la facture.");
  }

  const now = new Date().toISOString();
  await database.from("saas_payment_transactions").update({
    status: "succeeded",
    paid_at: now,
    updated_at: now,
    metadata: { wave_checkout_id: checkout.id, wave_transaction_id: checkout.transaction_id || null },
  }).eq("id", transaction.id);
  await database.from("saas_invoices").update({ status: "paid", paid_at: now }).eq("id", invoice.id);
  if (transaction.subscription_id) {
    await database.from("saas_subscriptions").update({ ...(invoice.plan_id ? { plan_id: invoice.plan_id } : {}), status: "active", starts_at: now, updated_at: now }).eq("id", transaction.subscription_id);
  }
  return "succeeded";
}
