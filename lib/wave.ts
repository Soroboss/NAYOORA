import { createAdminClient } from "@/lib/insforge/server";

const WAVE_API_URL = "https://api.wave.com/v1/checkout/sessions";

export type WaveCheckout = {
  id: string;
  amount: string;
  currency: string;
  checkout_status: "open" | "complete" | "expired";
  payment_status: "processing" | "cancelled" | "succeeded";
  transaction_id?: string | null;
  wave_launch_url: string;
  when_expires?: string | null;
  client_reference?: string | null;
};

function waveApiKey() {
  const key = process.env.WAVE_API_KEY;
  if (!key) throw new Error("Le paiement Wave n’est pas encore configuré par NAYOORA.");
  return key;
}

async function waveRequest(path = "", init?: RequestInit): Promise<WaveCheckout> {
  const response = await fetch(`${WAVE_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${waveApiKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error_message || payload?.message || "Wave n’a pas pu préparer le paiement.");
  }
  return payload as WaveCheckout;
}

export async function createWaveCheckout(input: {
  amount: number;
  intentId: string;
  clientReference?: string;
  successUrl: string;
  errorUrl: string;
  payerMobile?: string | null;
}) {
  const body: Record<string, string> = {
    amount: String(Math.round(input.amount)),
    currency: "XOF",
    client_reference: input.clientReference || `nayoora:${input.intentId}`,
    success_url: input.successUrl,
    error_url: input.errorUrl,
  };
  if (input.payerMobile?.startsWith("+")) body.restrict_payer_mobile = input.payerMobile;
  return waveRequest("", { method: "POST", body: JSON.stringify(body) });
}

export async function retrieveWaveCheckout(checkoutId: string) {
  return waveRequest(`/${encodeURIComponent(checkoutId)}`);
}

export async function reconcileWaveIntent(intentId: string, checkout: WaveCheckout) {
  const database = await createAdminClient();
  const { data: intent } = await database
    .from("payment_intents")
    .select("id,organization_id,member_profile_id,contribution_id,amount,status,provider_reference")
    .eq("id", intentId)
    .eq("provider", "wave")
    .maybeSingle();

  if (!intent || intent.provider_reference !== checkout.id) throw new Error("Paiement Wave introuvable.");
  if (checkout.payment_status !== "succeeded") {
    const status = checkout.checkout_status === "expired" ? "expired" : checkout.payment_status === "cancelled" ? "cancelled" : "pending";
    await database.from("payment_intents").update({ status, updated_at: new Date().toISOString() }).eq("id", intent.id);
    return status;
  }
  if (intent.status === "succeeded") return "succeeded";

  const providerReference = checkout.transaction_id || checkout.id;
  const { data: existingPayment } = await database
    .from("payments")
    .select("id")
    .eq("provider", "wave")
    .eq("provider_reference", providerReference)
    .maybeSingle();

  if (!existingPayment) {
    const { data: contribution } = await database
      .from("contributions")
      .select("id,contribution_plan_id,amount_due,amount_paid")
      .eq("id", intent.contribution_id)
      .eq("organization_id", intent.organization_id)
      .eq("member_profile_id", intent.member_profile_id)
      .maybeSingle();
    if (!contribution) throw new Error("Cotisation associée introuvable.");

    const amount = Number(intent.amount);
    const outstanding = Number(contribution.amount_due) - Number(contribution.amount_paid);
    if (amount <= 0 || amount > outstanding) throw new Error("Le montant Wave ne correspond plus au solde de la cotisation.");

    const { error: paymentError } = await database.from("payments").insert({
      organization_id: intent.organization_id,
      member_profile_id: intent.member_profile_id,
      contribution_plan_id: contribution.contribution_plan_id,
      contribution_id: contribution.id,
      amount,
      currency: "XOF",
      status: "confirmed",
      provider: "wave",
      provider_reference: providerReference,
      paid_at: new Date().toISOString(),
      metadata: { wave_checkout_id: checkout.id, payment_intent_id: intent.id },
    });
    if (paymentError) throw paymentError;

    const paid = Number(contribution.amount_paid) + amount;
    const { error: contributionError } = await database.from("contributions").update({
      amount_paid: paid,
      status: paid >= Number(contribution.amount_due) ? "paid" : "partially_paid",
    }).eq("id", contribution.id);
    if (contributionError) throw contributionError;
  }

  await database.from("payment_intents").update({ status: "succeeded", updated_at: new Date().toISOString() }).eq("id", intent.id);
  return "succeeded";
}
