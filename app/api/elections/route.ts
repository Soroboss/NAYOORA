import { NextResponse } from "next/server";
import { createClient } from "@/lib/insforge/server";

const managers = ["organization_admin", "president", "secretaire", "gestionnaire"];
const positions = ["president", "vice_president", "secretaire", "tresorier", "commissaire"];

export async function POST(request: Request) {
  const insforge = await createClient();
  const { data: { user } } = await insforge.auth.getUser();
  const { data: membership } = user ? await insforge.from("organization_members").select("organization_id,role").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle() : { data: null };
  if (!user || !membership || !managers.includes(membership.role)) return NextResponse.json({ error: "Droits de gestion requis." }, { status: 403 });
  try {
    const body = await request.json();
    if (!body.memberId || !body.title) throw new Error("Membre et titre d'élection requis.");
    const position = positions.includes(body.position) ? body.position : "president";
    const { data: member } = await insforge.from("member_profiles").select("id").eq("id", body.memberId).eq("organization_id", membership.organization_id).is("deleted_at", null).maybeSingle();
    if (!member) throw new Error("Membre introuvable.");
    await insforge.from("member_profiles").update({ is_current_officer: false }).eq("organization_id", membership.organization_id).eq("office_role", position);
    const { data: election, error } = await insforge.from("organization_elections").insert({ organization_id: membership.organization_id, title: body.title, position, elected_member_profile_id: body.memberId, status: "validated", election_date: body.electionDate || null, effective_on: body.effectiveOn || body.electionDate || new Date().toISOString().slice(0, 10), notes: body.notes || null, created_by: user.id }).select().single();
    if (error) throw error;
    const { error: updateError } = await insforge.from("member_profiles").update({ office_role: position, office_title: position.replace("_", " "), role_started_on: body.effectiveOn || body.electionDate || new Date().toISOString().slice(0, 10), is_current_officer: true, status: "active", updated_at: new Date().toISOString() }).eq("id", body.memberId).eq("organization_id", membership.organization_id);
    if (updateError) throw updateError;
    await insforge.from("access_logs").insert({ organization_id: membership.organization_id, user_id: user.id, event_type: "election_validated", metadata: { election_id: election.id, member_id: body.memberId, position } });
    return NextResponse.json({ item: election }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Élection impossible à enregistrer." }, { status: 400 });
  }
}
