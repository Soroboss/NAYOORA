import { NextResponse } from "next/server";
import { getCurrentOrganizationContext } from "@/lib/current-organization";

const financeRoles = ["organization_admin", "president", "tresorier"];

function readableError(error: unknown) {
  const raw = typeof error === "object" && error !== null
    ? String((error as any).message || (error as any).details || (error as any).hint || "")
    : error instanceof Error ? error.message : String(error || "");
  const message = raw.toLowerCase();
  if (message.includes("finance permission denied")) return "Vous n’avez pas les droits nécessaires pour enregistrer ce paiement.";
  if (message.includes("contribution not found")) return "Cette échéance n’appartient pas à l’organisation actuellement sélectionnée.";
  if (message.includes("amount exceeds outstanding balance")) return "Le montant dépasse le reste à payer de cette cotisation.";
  if (message.includes("amount must be positive")) return "Le montant du paiement doit être positif.";
  if (message.includes("schema cache") || message.includes("could not find the function")) return "Le service de paiement vient d’être mis à jour. Actualisez la page puis réessayez.";
  return raw || "Le paiement n’a pas pu être enregistré. Actualisez la page puis réessayez.";
}

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

    if(body.action === "update_plan"){
      if(!body.planId) throw new Error("Plan requis.");
      const updates: any = {};
      if(body.name !== undefined) updates.name = body.name;
      if(body.amount !== undefined) updates.amount = Number(body.amount);
      if(body.frequency !== undefined) updates.frequency = body.frequency;
      if(body.active !== undefined) updates.active = body.active === "true" || body.active === true;
      if(body.notes !== undefined) updates.notes = body.notes;
      if(body.startDate !== undefined) updates.start_date = body.startDate || null;
      if(body.endDate !== undefined) updates.end_date = body.endDate || null;
      
      const {error} = await insforge.from("contribution_plans").update(updates).eq("id", body.planId).eq("organization_id", org);
      if(error) throw error;
      return NextResponse.json({ok: true});
    }

    if(body.action === "plan_disbursement"){
      if(!body.planId || Number(body.amount) <= 0) throw new Error("Plan et montant positif requis.");
      let {data: cashAcc, error: cashError} = await insforge.from("cash_accounts").select("id").eq("organization_id", org).eq("active", true).order("created_at").limit(1).single();
      if(cashError || !cashAcc) {
        const { data: newAcc, error: createError } = await insforge.from("cash_accounts").insert({ organization_id: org, name: "Caisse Principale", account_type: "cash", currency: "XOF" }).select("id").single();
        if (createError || !newAcc) throw new Error("Impossible d'initialiser le compte de caisse.");
        cashAcc = newAcc;
      }
      
      // Enregistrer d'abord la transaction de caisse
      const {data: cashTx, error: txError} = await insforge.from("cash_transactions").insert({
        organization_id: org, cash_account_id: cashAcc.id, direction: 'out', category: 'reversement_plan', amount: Number(body.amount), notes: body.notes || "Reversement", created_by: user.id
      }).select().single();
      if(txError) throw txError;
      
      // Enregistrer le reversement lié au plan
      const {data, error} = await insforge.from("disbursements").insert({
        organization_id: org, contribution_plan_id: body.planId, cash_transaction_id: cashTx.id, amount: Number(body.amount), notes: body.notes, approved_by: user.id
      }).select().single();
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
      const {data, error} = await insforge.rpc("record_contribution_payment_v2", {p_organization_id: org, p_contribution_id: body.contributionId, p_amount: Number(body.amount), p_provider: body.provider || "cash", p_provider_reference: body.reference || null, p_notes: body.notes || ""});
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
      let {data: cashAcc, error: cashError} = await insforge.from("cash_accounts").select("id").eq("organization_id", org).eq("active", true).order("created_at").limit(1).single();
      if(cashError || !cashAcc) {
        const { data: newAcc, error: createError } = await insforge.from("cash_accounts").insert({ organization_id: org, name: "Caisse Principale", account_type: "cash", currency: "XOF" }).select("id").single();
        if (createError || !newAcc) throw new Error("Impossible d'initialiser le compte de caisse.");
        cashAcc = newAcc;
      }
      const {data, error} = await insforge.from("cash_transactions").insert({organization_id: org, cash_account_id: cashAcc.id, direction: body.direction, category: body.category, amount: Number(body.amount), notes: body.notes || null, created_by: user.id}).select().single(); 
      if(error) throw error; 
      return NextResponse.json({item: data}, {status: 201}); 
    }

    throw new Error("Action inconnue.");
  } catch(error) {
    return NextResponse.json({error: readableError(error)}, {status: 400});
  } 
}
