import { NextResponse } from "next/server";
import { getCurrentOrganizationContext } from "@/lib/current-organization";

const financeRoles = ["organization_admin", "president", "tresorier"];

export async function POST(request: Request) { 
  const {insforge, user, membership} = await getCurrentOrganizationContext();
  if(!membership || !financeRoles.includes(membership.role))
    return NextResponse.json({error: "Droits trésorerie requis."}, {status: 403}); 
    
  try { 
    const body = await request.json(); 
    const org = membership.organization_id;

    if(body.action === "plan"){ 
      if(!body.name || Number(body.amount) < 0) throw new Error("Nom et montant requis."); 
      const {data, error} = await insforge.from("contribution_plans").insert({organization_id: org, name: body.name, amount: Number(body.amount), frequency: body.frequency, start_date: body.startDate || null, end_date: body.endDate || null}).select().single(); 
      if(error) throw error; 
      return NextResponse.json({item: data}, {status: 201}); 
    }

    if(body.action === "contribution"){ 
      if(!body.memberId || !body.planId || !body.dueDate) throw new Error("Membre, plan et échéance requis."); 
      const {data: plan, error: planError} = await insforge.from("contribution_plans").select("amount").eq("id", body.planId).eq("organization_id", org).single(); 
      if(planError) throw planError; 
      const {data, error} = await insforge.from("contributions").insert({organization_id: org, member_profile_id: body.memberId, contribution_plan_id: body.planId, due_date: body.dueDate, amount_due: plan.amount}).select().single(); 
      if(error) throw error; 
      return NextResponse.json({item: data}, {status: 201}); 
    }

    if(body.action === "mass_contribution"){ 
      if(!body.planId || !body.dueDate) throw new Error("Plan et échéance requis."); 
      const {data: plan, error: planError} = await insforge.from("contribution_plans").select("amount").eq("id", body.planId).eq("organization_id", org).single(); 
      if(planError) throw planError; 
      let query = insforge.from("member_profiles").select("id").eq("organization_id", org).is("deleted_at", null).eq("status", "active"); 
      if(body.excludeMemberId) query = query.neq("id", body.excludeMemberId); 
      const {data: members, error: membersError} = await query; 
      if(membersError) throw membersError; 
      if(!members || members.length === 0) throw new Error("Aucun membre actif trouvé."); 
      const payload = members.map((m: any) => ({organization_id: org, member_profile_id: m.id, contribution_plan_id: body.planId, due_date: body.dueDate, amount_due: plan.amount})); 
      const {error} = await insforge.from("contributions").insert(payload); 
      if(error) throw error; 
      return NextResponse.json({ok: true, count: members.length}, {status: 201}); 
    }

    if(body.action === "payment"){ 
      if(!body.contributionId || Number(body.amount) <= 0) throw new Error("Échéance et montant positif requis.");
      const {data, error} = await insforge.rpc("record_contribution_payment", {p_organization_id: org, p_contribution_id: body.contributionId, p_amount: Number(body.amount), p_provider: body.provider || null, p_provider_reference: body.reference || null, p_notes: body.notes || null}); 
      if(error) throw error; 
      return NextResponse.json({paymentId: data}); 
    }

    if(body.action === "validate_payment") {
      if(!body.paymentId) throw new Error("Paiement manquant.");
      const { data, error } = await insforge.rpc("validate_declared_contribution_payment", { p_organization_id: org, p_payment_id: body.paymentId });
      if(error) throw error;
      return NextResponse.json({ success: true, paymentId: data });
    }

    if(body.action === "reject_payment") {
      if(!body.paymentId) throw new Error("Paiement manquant");
      const { error } = await insforge.from("payments").update({
        status: 'failed', 
        rejection_reason: body.rejectionReason || 'Rejeté par un administrateur' 
      }).eq("id", body.paymentId).eq("organization_id", org).eq("status", "pending");
      if(error) throw error;
      return NextResponse.json({ success: true });
    }

    if(body.action === "cash"){ 
      if(!body.category || Number(body.amount) <= 0) throw new Error("Catégorie et montant positif requis."); 
      const {data, error} = await insforge.from("cash_transactions").insert({organization_id: org, direction: body.direction, category: body.category, amount: Number(body.amount), notes: body.notes || null, created_by: user.id}).select().single(); 
      if(error) throw error; 
      return NextResponse.json({item: data}, {status: 201}); 
    }

    throw new Error("Action inconnue.");
  } catch(error) {
    return NextResponse.json({error: error instanceof Error ? error.message : "Opération impossible."}, {status: 400});
  } 
}
