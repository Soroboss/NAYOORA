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
  if (!user || !membership || !roles.includes(membership.role)) return NextResponse.json({ error: "Droits de gestion Épargne requis." }, { status: 403 });
  
  const organizationId = membership.organization_id;
  
  try {
    const body = await request.json();
    
    // 1. Create a savings product
    if (body.action === "product") {
      if (!body.name || !body.contributionAmount || !body.durationDays) throw new Error("Nom, montant et durée requis.");
      const { data, error } = await insforge.from("tontine_savings_products").insert({
        organization_id: organizationId,
        name: body.name,
        contribution_amount: Number(body.contributionAmount),
        duration_days: Number(body.durationDays),
        commission_amount: Number(body.commissionAmount || 0),
        status: body.status || "active",
        created_by: user.id,
      }).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data }, { status: 201 });
    }
    
    // 2. Open a savings card (subscribe a member)
    if (body.action === "card") {
      if (!body.productId || !body.memberId) throw new Error("Produit et membre requis.");
      
      // Calculate expected amount
      const { data: product } = await insforge.from("tontine_savings_products").select("contribution_amount, duration_days").eq("id", body.productId).single();
      if (!product) throw new Error("Produit introuvable.");
      
      const expectedAmount = Number(product.contribution_amount) * Number(product.duration_days);
      
      const { data, error } = await insforge.from("tontine_savings_cards").insert({
        organization_id: organizationId,
        product_id: body.productId,
        member_profile_id: body.memberId,
        collector_id: body.collectorId || null,
        start_date: body.startDate || new Date().toISOString().split('T')[0],
        expected_amount: expectedAmount,
        status: "active",
        created_by: user.id,
      }).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data }, { status: 201 });
    }
    
    // 3. Record a daily collection
    if (body.action === "collection") {
      if (!body.cardId || !body.amountPaid) throw new Error("Carte et montant requis.");
      const { data, error } = await insforge.from("tontine_savings_collections").insert({
        organization_id: organizationId,
        card_id: body.cardId,
        collector_id: body.collectorId || null,
        amount_paid: Number(body.amountPaid),
        collection_date: body.collectionDate || new Date().toISOString().split('T')[0],
        status: "collected",
        created_by: user.id,
      }).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data }, { status: 201 });
    }
    
    // 4. Process final payout
    if (body.action === "payout") {
      if (!body.cardId || !body.grossAmount) throw new Error("Carte et montant brut requis.");
      
      const gross = Number(body.grossAmount);
      const commission = Number(body.commissionAmount || 0);
      const net = Math.max(gross - commission, 0);
      
      const { data, error } = await insforge.from("tontine_savings_payouts").insert({
        organization_id: organizationId,
        card_id: body.cardId,
        gross_amount: gross,
        commission_amount: commission,
        net_amount: net,
        payout_date: body.payoutDate || new Date().toISOString().split('T')[0],
        status: "paid",
        created_by: user.id,
      }).select().single();
      
      if (error) throw error;
      
      // Update card status to paid
      await insforge.from("tontine_savings_cards").update({ status: "paid" }).eq("id", body.cardId);
      
      return NextResponse.json({ item: data }, { status: 201 });
    }
    
    throw new Error("Action inconnue.");
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Opération impossible." }, { status: 400 });
  }
}
