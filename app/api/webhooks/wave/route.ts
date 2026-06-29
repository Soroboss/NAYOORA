import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/insforge/server";
import { reconcileWaveIntent, type WaveCheckout } from "@/lib/wave";
import { reconcileSaasWaveTransaction } from "@/lib/saas-billing";

function validSignature(rawBody: string, header: string | null) {
  const secret = process.env.WAVE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((part) => part.split("=", 2)));
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300 || !parts.v1) return false;
  const expected = createHmac("sha256", secret).update(`${parts.t}${rawBody}`).digest("hex");
  const actualBuffer = Buffer.from(parts.v1, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!validSignature(rawBody, request.headers.get("wave-signature"))) {
    return NextResponse.json({ error: "Signature Wave invalide." }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody) as { id?: string; type?: string; data?: WaveCheckout };
    const database = await createAdminClient();
    const { data: known } = event.id
      ? await database.from("payment_webhook_events").select("id,processed_at").eq("provider", "wave").eq("event_id", event.id).maybeSingle()
      : { data: null };
    if (known?.processed_at) return NextResponse.json({ received: true });

    if (event.id && !known) {
      await database.from("payment_webhook_events").insert({ provider: "wave", event_id: event.id, payload: event });
    }
    if (event.type === "checkout.session.completed" && event.data?.id) {
      const intentId = event.data.client_reference?.startsWith("nayoora:")
        ? event.data.client_reference.slice("nayoora:".length)
        : null;
      if (intentId) await reconcileWaveIntent(intentId, event.data);
      const billingTransactionId = event.data.client_reference?.startsWith("nayoora-saas:")
        ? event.data.client_reference.slice("nayoora-saas:".length)
        : null;
      if (billingTransactionId) await reconcileSaasWaveTransaction(billingTransactionId, event.data);
    }
    if (event.id) await database.from("payment_webhook_events").update({ processed_at: new Date().toISOString() }).eq("provider", "wave").eq("event_id", event.id);
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook Wave invalide." }, { status: 400 });
  }
}
