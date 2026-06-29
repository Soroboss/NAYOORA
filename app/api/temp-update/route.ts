import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/insforge/server";

export async function GET() {
  const insforge = await createAdminClient();
  const orgId = "8d2cecf1-e6c3-491d-a434-9e50ee914192";

  // 1. Get due contributions
  const { data: contributions } = await insforge
    .from("contributions")
    .select("id, member_profile_id, contribution_plan_id, amount_due")
    .eq("organization_id", orgId)
    .eq("status", "due");

  if (!contributions || contributions.length === 0) {
    return NextResponse.json({ message: "No due contributions found." });
  }

  let totalAmount = 0;

  for (const c of contributions) {
    totalAmount += c.amount_due;

    // Insert payment
    await insforge.from("payments").insert({
      organization_id: orgId,
      member_profile_id: c.member_profile_id,
      contribution_plan_id: c.contribution_plan_id,
      amount: c.amount_due,
      status: "completed",
      provider: "cash",
      paid_at: new Date().toISOString()
    });

    // Update contribution
    await insforge.from("contributions").update({
      amount_paid: c.amount_due,
      status: "paid",
      updated_at: new Date().toISOString()
    }).eq("id", c.id);
  }

  if (totalAmount > 0) {
    await insforge.from("cash_transactions").insert({
      organization_id: orgId,
      direction: "in",
      amount: totalAmount,
      category: "contribution",
      description: "Paiement en bloc des cotisations (Elite)",
      status: "posted",
      occurred_at: new Date().toISOString()
    });
  }

  return NextResponse.json({ 
    message: "Updated successfully", 
    count: contributions.length,
    totalAmount
  });
}
