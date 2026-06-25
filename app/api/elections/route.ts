import { NextResponse } from "next/server";
import { canManageMembers, getCurrentOrganizationContext } from "@/lib/current-organization";

const positions = ["president", "vice_president", "secretaire", "tresorier", "commissaire"];

export async function POST(request: Request) {
  const { insforge, user, membership } = await getCurrentOrganizationContext();
  if (!canManageMembers(membership.role)) return NextResponse.json({ error: "Droits de gestion requis." }, { status: 403 });
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
