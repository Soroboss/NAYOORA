import { NextResponse } from "next/server";
import { createClient } from "@/lib/insforge/server";

const financeRoles = ["organization_admin", "president", "tresorier"];

async function context() { 
  const insforge = await createClient(); 
  const { data: { user } } = await insforge.auth.getUser(); 
  const { data: membership } = user 
    ? await insforge.from("organization_members").select("organization_id,role").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle() 
    : { data: null }; 
  return { insforge, user, membership }; 
}

export async function POST(request: Request) { 
  const {insforge, user, membership} = await context(); 
  if(!user || !membership || !financeRoles.includes(membership.role)) 
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
      const {data, error} = await insforge.rpc("record_contribution_payment", {p_organization_id: org, p_contribution_id: body.contributionId, p_amount: Number(body.amount), p_provider: body.provider || null, p_provider_reference: body.reference || null, p_notes: body.notes || null}); 
      if(error) throw error; 
      return NextResponse.json({paymentId: data}); 
    }

    if(body.action === "validate_payment") {
      if(!body.paymentId || !body.contributionId) throw new Error("Données manquantes");
      const amt = Number(body.amount);

      // Fetch current contribution
      const { data: contrib } = await insforge.from("contributions").select("amount_paid, amount_due").eq("id", body.contributionId).single();
      if(!contrib) throw new Error("Cotisation introuvable");

      const newPaid = Number(contrib.amount_paid) + amt;
      const newStatus = newPaid >= Number(contrib.amount_due) ? 'paid' : (newPaid > 0 ? 'partial' : 'pending');

      // Update payment
      await insforge.from("payments").update({ status: 'completed', paid_at: new Date().toISOString() }).eq("id", body.paymentId);
      
      // Update contribution
      await insforge.from("contributions").update({ amount_paid: newPaid, status: newStatus }).eq("id", body.contributionId);
      
      // Insert cash transaction
      await insforge.from("cash_transactions").insert({
        organization_id: org,
        direction: 'in',
        category: 'cotisation',
        amount: amt,
        reference: `Validé depuis décl.: ${body.paymentId}`,
        created_by: user.id
      });
      
      return NextResponse.json({ success: true });
    }

    if(body.action === "reject_payment") {
      if(!body.paymentId) throw new Error("Paiement manquant");
      await insforge.from("payments").update({ 
        status: 'failed', 
        rejection_reason: body.rejectionReason || 'Rejeté par un administrateur' 
      }).eq("id", body.paymentId);
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
