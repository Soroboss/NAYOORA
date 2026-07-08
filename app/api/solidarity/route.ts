import { NextResponse } from "next/server";
import { getCurrentOrganizationContext } from "@/lib/current-organization";

const roles = ["organization_admin", "president", "tresorier"];

export async function POST(request: Request) {
  const { insforge, membership } = await getCurrentOrganizationContext();
  if (!roles.includes(membership.role)) return NextResponse.json({ error: "Droits de gestion requis." }, { status: 403 });
  try {
    const body = await request.json();
    const organizationId = membership.organization_id;
    if (body.action === "case") {
      if (!body.memberId || !body.type || !body.title) throw new Error("Membre, type et titre requis.");
      const { data, error } = await insforge.from("solidarity_cases").insert({
        organization_id: organizationId,
        member_profile_id: body.memberId,
        case_type: body.type,
        title: body.title,
        requested_amount: Number(body.amount || 0),
        approved_amount: Number(body.approved || 0) || null,
        status: body.approved ? "approved" : "open",
        notes: body.notes || null,
      }).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data });
    }
    if (body.action === "update_case") {
      if (!body.caseId) throw new Error("Dossier requis.");
      const updates: any = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.amount !== undefined) updates.requested_amount = Number(body.amount);
      if (body.approved !== undefined) updates.approved_amount = Number(body.approved) || null;
      if (body.notes !== undefined) updates.notes = body.notes;
      if (body.status !== undefined) updates.status = body.status;
      
      const { error } = await insforge.from("solidarity_cases").update(updates).eq("id", body.caseId).eq("organization_id", organizationId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    
    if (body.action === "contribution") {
      if (!body.caseId || Number(body.amount) <= 0) throw new Error("Dossier et montant requis.");
      const { data, error } = await insforge.from("solidarity_contributions").insert({ organization_id: organizationId, solidarity_case_id: body.caseId, member_profile_id: body.memberId || null, amount: Number(body.amount) }).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data });
    }
    if (body.action === "disbursement") {
      if (!body.caseId || Number(body.amount) <= 0) throw new Error("Dossier et montant positif requis.");
      const { data, error } = await insforge.rpc("disburse_solidarity_case", { p_organization_id: organizationId, p_case_id: body.caseId, p_amount: Number(body.amount), p_notes: body.notes || null });
      if (error) throw error;
      return NextResponse.json({ item: data });
    }
    throw new Error("Action inconnue.");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Opération impossible." }, { status: 400 });
  }
}
