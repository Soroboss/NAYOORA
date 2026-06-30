import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient as createClient } from "@/lib/insforge/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionString = cookieStore.get("portal_session")?.value;
  if (!sessionString) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let session;
  try {
    session = JSON.parse(sessionString);
  } catch {
    return NextResponse.json({ error: "Invalide" }, { status: 401 });
  }

  const body = await request.json();
  const { contributionId, planId, amount, provider, provider_reference, proof_url } = body;

  if (!contributionId || !planId || !amount || !provider) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const insforge = await createClient();

  // Get member details
  const { data: member } = await insforge
    .from("member_profiles")
    .select("organization_id")
    .eq("id", session.memberId)
    .single();

  if (!member) return NextResponse.json({ error: "Membre non trouvé" }, { status: 404 });
  if (member.organization_id !== session.organizationId) return NextResponse.json({ error: "Organisation invalide" }, { status: 403 });

  const { data: contribution } = await insforge.from("contributions").select("id,amount_due,amount_paid,contribution_plan_id").eq("id", contributionId).eq("organization_id", member.organization_id).eq("member_profile_id", session.memberId).maybeSingle();
  if (!contribution || contribution.contribution_plan_id !== planId) return NextResponse.json({ error: "Cotisation introuvable" }, { status: 404 });
  const remaining = Number(contribution.amount_due) - Number(contribution.amount_paid);
  if (Number(amount) <= 0 || Number(amount) > remaining) return NextResponse.json({ error: "Montant de paiement invalide" }, { status: 400 });

  // Insert payment as pending
  const { error } = await insforge.from("payments").insert({
    organization_id: member.organization_id,
    member_profile_id: session.memberId,
    contribution_plan_id: planId,
    contribution_id: contributionId,
    amount: amount,
    provider: provider,
    provider_reference: provider_reference || null,
    proof_url: proof_url || null,
    status: "pending"
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
