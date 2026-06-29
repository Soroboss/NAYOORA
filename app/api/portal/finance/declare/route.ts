import { NextResponse } from "next";
import { cookies } from "next/headers";
import { createClient } from "@/lib/insforge/server";

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
  const { planId, amount, provider, provider_reference, proof_url } = body;

  if (!planId || !amount || !provider) {
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

  // Insert payment as pending
  const { error } = await insforge.from("payments").insert({
    organization_id: member.organization_id,
    member_profile_id: session.memberId,
    contribution_plan_id: planId,
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
