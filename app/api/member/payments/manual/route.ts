import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/insforge/server";

const providers = new Set(["wave", "orange_money"]);

export async function POST(request: Request) {
  try {
    const rawSession = (await cookies()).get("member_session")?.value;
    if (!rawSession) return NextResponse.json({ error: "Connexion membre requise." }, { status: 401 });
    const session = JSON.parse(rawSession) as { memberId?: string; organizationId?: string };
    const body = await request.json();
    const reference = String(body.reference || "").trim();
    if (!session.memberId || !session.organizationId || !body.contributionId || !providers.has(body.provider) || reference.length < 4) {
      return NextResponse.json({ error: "Fournisseur et référence de transaction requis." }, { status: 400 });
    }

    const database = await createAdminClient();
    const { data: contribution } = await database.from("contributions")
      .select("id,contribution_plan_id,amount_due,amount_paid")
      .eq("id", body.contributionId)
      .eq("organization_id", session.organizationId)
      .eq("member_profile_id", session.memberId)
      .maybeSingle();
    if (!contribution) return NextResponse.json({ error: "Cotisation introuvable." }, { status: 404 });

    const amount = Number(contribution.amount_due) - Number(contribution.amount_paid);
    if (amount <= 0) return NextResponse.json({ error: "Cette cotisation est déjà réglée." }, { status: 400 });
    const { error } = await database.from("payments").insert({
      organization_id: session.organizationId,
      member_profile_id: session.memberId,
      contribution_plan_id: contribution.contribution_plan_id,
      contribution_id: contribution.id,
      amount,
      currency: "XOF",
      status: "pending",
      provider: body.provider,
      provider_reference: reference,
      metadata: { declared_by_member: true, destination_phone: "+2250757228731" },
    });
    if (error) {
      const duplicate = String(error.message || "").toLowerCase().includes("unique");
      return NextResponse.json({ error: duplicate ? "Cette référence a déjà été déclarée." : error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Déclaration impossible." }, { status: 500 });
  }
}
