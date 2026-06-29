import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/insforge/server";
import { reconcileWaveIntent, retrieveWaveCheckout } from "@/lib/wave";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const intentId = url.searchParams.get("intent");
  const origin = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ? process.env.NEXT_PUBLIC_APP_URL : url.origin;
  const destination = new URL("/member/contributions", origin);

  try {
    const rawSession = (await cookies()).get("member_session")?.value;
    if (!rawSession || !intentId) throw new Error("Session invalide");
    const session = JSON.parse(rawSession) as { memberId?: string; organizationId?: string };
    const database = await createAdminClient();
    const { data: intent } = await database.from("payment_intents")
      .select("id,member_profile_id,organization_id,provider_reference")
      .eq("id", intentId)
      .eq("member_profile_id", session.memberId)
      .eq("organization_id", session.organizationId)
      .maybeSingle();
    if (!intent?.provider_reference) throw new Error("Paiement introuvable");
    const checkout = await retrieveWaveCheckout(intent.provider_reference);
    const status = await reconcileWaveIntent(intent.id, checkout);
    destination.searchParams.set("payment", status);
  } catch {
    destination.searchParams.set("payment", "failed");
  }
  return NextResponse.redirect(destination);
}
