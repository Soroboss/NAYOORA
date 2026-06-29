import { NextResponse } from "next/server";
import { createClient } from "@/lib/insforge/server";

const roles = ["organization_admin", "president", "tresorier", "gestionnaire"];

async function context() {
  const insforge = await createClient();
  const { data: { user } } = await insforge.auth.getUser();
  const { data: membership } = user ? await insforge.from("organization_members").select("organization_id,role").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle() : { data: null };
  return { insforge, user, membership };
}

export async function POST(request: Request) {
  const { insforge, user, membership } = await context();
  if (!user || !membership || !roles.includes(membership.role)) return NextResponse.json({ error: "Droits de gestion Tontine requis." }, { status: 403 });
  const organizationId = membership.organization_id;
  try {
    const body = await request.json();
    if (body.action === "group") {
      if (!body.name) throw new Error("Nom du groupe requis.");
      const { data, error } = await insforge.from("tontine_groups").insert({
        organization_id: organizationId,
        name: body.name,
        contribution_amount: Number(body.amount || 0),
        frequency: body.frequency || "monthly",
        commission_type: body.commissionType || "fixed",
        commission_amount: Number(body.commissionAmount || 0),
        status: body.status || "draft",
        created_by: user.id,
        rules: { beneficiary_order: "rank", payout_rule: "one_beneficiary_per_cycle" },
      }).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data }, { status: 201 });
    }
    if (body.action === "participant") {
      if (!body.groupId || !body.displayName || Number(body.rank) <= 0) throw new Error("Groupe, nom et rang requis.");
      const { data, error } = await insforge.from("tontine_participants").insert({
        organization_id: organizationId,
        tontine_group_id: body.groupId,
        member_profile_id: body.memberId || null,
        display_name: body.displayName,
        phone: body.phone || null,
        email: body.email || null,
        payout_rank: Number(body.rank),
        contribution_multiplier: Number(body.multiplier || 1),
      }).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data }, { status: 201 });
    }
    if (body.action === "cycle") {
      if (!body.groupId || Number(body.cycleNumber) <= 0) throw new Error("Groupe et numéro de cycle requis.");
      const { data, error } = await insforge.from("tontine_cycles").insert({
        organization_id: organizationId,
        tontine_group_id: body.groupId,
        cycle_number: Number(body.cycleNumber),
        starts_on: body.startsOn || null,
        ends_on: body.endsOn || null,
        collection_due_on: body.collectionDueOn || null,
        payout_on: body.payoutOn || null,
        beneficiary_participant_id: body.beneficiaryId || null,
        expected_amount: Number(body.expectedAmount || 0),
        commission_amount: Number(body.commissionAmount || 0),
        status: body.status || "planned",
        notes: body.notes || null,
      }).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data }, { status: 201 });
    }
    if (body.action === "collection") {
      if (!body.groupId || !body.cycleId || !body.participantId) throw new Error("Groupe, cycle et participant requis.");
      const paid = Number(body.amountPaid || 0), due = Number(body.amountDue || 0);
      const { data, error } = await insforge.from("tontine_collections").insert({
        organization_id: organizationId,
        tontine_group_id: body.groupId,
        tontine_cycle_id: body.cycleId,
        participant_id: body.participantId,
        amount_due: due,
        amount_paid: paid,
        commission_paid: Number(body.commissionPaid || 0),
        payment_method: body.paymentMethod || null,
        status: paid >= due && due > 0 ? "paid" : paid > 0 ? "partial" : "pending",
        paid_at: paid > 0 ? new Date().toISOString() : null,
        created_by: user.id,
        notes: body.notes || null,
      }).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data }, { status: 201 });
    }
    if (body.action === "payout") {
      if (!body.groupId || !body.cycleId || !body.beneficiaryId) throw new Error("Groupe, cycle et bénéficiaire requis.");
      const gross = Number(body.grossAmount || 0), commission = Number(body.commissionAmount || 0);
      const { data, error } = await insforge.from("tontine_payouts").insert({
        organization_id: organizationId,
        tontine_group_id: body.groupId,
        tontine_cycle_id: body.cycleId,
        beneficiary_participant_id: body.beneficiaryId,
        gross_amount: gross,
        commission_amount: commission,
        net_amount: Math.max(gross - commission, 0),
        status: body.status || "scheduled",
        scheduled_at: body.scheduledAt || null,
        paid_at: body.status === "paid" ? new Date().toISOString() : null,
        created_by: user.id,
        notes: body.notes || null,
      }).select().single();
      if (error) throw error;
      if (body.status === "paid") {
        await insforge.from("tontine_cycles").update({ status: "paid" }).eq("id", body.cycleId).eq("organization_id", organizationId);
        await insforge.from("access_logs").insert({ organization_id: organizationId, user_id: user.id, event_type: "tontine_payout_paid", metadata: { payout_id: data.id, beneficiary_id: body.beneficiaryId, net_amount: Math.max(gross - commission, 0) } });
      }
      return NextResponse.json({ item: data }, { status: 201 });
    }
    if (body.action === "payout_status") {
      if (!body.payoutId || !["approved", "paid", "cancelled"].includes(body.status)) throw new Error("Reversement et statut requis.");
      const { data: payout } = await insforge.from("tontine_payouts").select("id,tontine_cycle_id,beneficiary_participant_id,net_amount").eq("id", body.payoutId).eq("organization_id", organizationId).maybeSingle();
      if (!payout) throw new Error("Reversement introuvable.");
      const { data, error } = await insforge.from("tontine_payouts").update({ status: body.status, paid_at: body.status === "paid" ? new Date().toISOString() : null }).eq("id", payout.id).eq("organization_id", organizationId).select().single();
      if (error) throw error;
      if (body.status === "paid") {
        await insforge.from("tontine_cycles").update({ status: "paid" }).eq("id", payout.tontine_cycle_id).eq("organization_id", organizationId);
        await insforge.from("access_logs").insert({ organization_id: organizationId, user_id: user.id, event_type: "tontine_payout_paid", metadata: { payout_id: payout.id, beneficiary_id: payout.beneficiary_participant_id, net_amount: payout.net_amount } });
      }
      return NextResponse.json({ item: data });
    }
    throw new Error("Action inconnue.");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Opération Tontine impossible." }, { status: 400 });
  }
}
