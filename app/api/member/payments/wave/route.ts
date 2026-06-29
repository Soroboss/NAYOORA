import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/insforge/server";
import { createWaveCheckout } from "@/lib/wave";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get("member_session")?.value;
    if (!rawSession) return NextResponse.json({ error: "Connexion membre requise." }, { status: 401 });
    const session = JSON.parse(rawSession) as { memberId?: string; organizationId?: string };
    const { contributionId } = await request.json();
    if (!session.memberId || !session.organizationId || !contributionId) {
      return NextResponse.json({ error: "Demande de paiement invalide." }, { status: 400 });
    }

    const database = await createAdminClient();
    const { data: contribution } = await database
      .from("contributions")
      .select("id,organization_id,member_profile_id,amount_due,amount_paid,status")
      .eq("id", contributionId)
      .eq("organization_id", session.organizationId)
      .eq("member_profile_id", session.memberId)
      .maybeSingle();
    if (!contribution) return NextResponse.json({ error: "Cotisation introuvable." }, { status: 404 });

    const amount = Math.round(Number(contribution.amount_due) - Number(contribution.amount_paid));
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "Cette cotisation est déjà réglée." }, { status: 400 });
    }

    const { data: member } = await database.from("member_profiles").select("phone").eq("id", session.memberId).maybeSingle();
    const { data: intent, error: intentError } = await database.from("payment_intents").insert({
      organization_id: session.organizationId,
      member_profile_id: session.memberId,
      contribution_id: contribution.id,
      provider: "wave",
      amount,
      currency: "XOF",
      status: "created",
    }).select("id").single();
    if (intentError || !intent) throw intentError || new Error("Impossible de préparer le paiement.");

    const origin = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")
      ? process.env.NEXT_PUBLIC_APP_URL
      : new URL(request.url).origin;
    const returnUrl = `${origin}/api/member/payments/wave/return?intent=${encodeURIComponent(intent.id)}`;
    const checkout = await createWaveCheckout({
      amount,
      intentId: intent.id,
      successUrl: `${returnUrl}&result=success`,
      errorUrl: `${returnUrl}&result=error`,
      payerMobile: member?.phone || null,
    });

    await database.from("payment_intents").update({
      status: "pending",
      provider_reference: checkout.id,
      checkout_url: checkout.wave_launch_url,
      expires_at: checkout.when_expires || null,
      updated_at: new Date().toISOString(),
    }).eq("id", intent.id);

    return NextResponse.json({ checkoutUrl: checkout.wave_launch_url, amount });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Paiement Wave indisponible." }, { status: 500 });
  }
}
