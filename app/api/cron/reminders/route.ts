import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/insforge/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Create an admin client bypassing RLS to scan all orgs
    const supabase = await createAdminClient();

    // Find active automation rules for contributions
    const { data: rules } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("is_active", true)
      .eq("rule_type", "contribution_reminder");

    if (!rules || rules.length === 0) {
      return NextResponse.json({ message: "Aucune règle active." });
    }

    let messagesSent = 0;

    for (const rule of rules) {
      // Find contributions that are due in `days_before_due` days, and not paid
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + rule.days_before_due);
      const targetDateString = targetDate.toISOString().split("T")[0];

      const { data: contributions } = await supabase
        .from("contributions")
        .select("*, member:member_profiles(id, first_name, last_name, phone)")
        .eq("organization_id", rule.organization_id)
        .eq("status", "pending")
        .eq("due_date", targetDateString);

      if (contributions) {
        for (const c of contributions) {
          const member = c.member as any;
          if (!member?.phone) continue;

          // Hydrate template
          let msg = rule.message_template || "Rappel: Cotisation due.";
          msg = msg.replace(/\[Nom\]/g, member.first_name);
          msg = msg.replace(/\[Montant\]/g, c.amount_due.toString());
          msg = msg.replace(/\[Date\]/g, new Date(c.due_date).toLocaleDateString("fr-FR"));

          // Record the message
          await supabase.from("messages").insert({
            organization_id: rule.organization_id,
            channel: "sms",
            recipient_count: 1,
            content: msg,
            status: "sent",
            sent_at: new Date().toISOString()
          });
          
          messagesSent++;
        }
      }

      // Update last run time
      await supabase.from("automation_rules").update({ last_run_at: new Date().toISOString() }).eq("id", rule.id);
    }

    return NextResponse.json({ success: true, messagesSent });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
