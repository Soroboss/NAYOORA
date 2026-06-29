import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrganizationContext } from "@/lib/current-organization";
import { RemindersManager } from "@/components/reminders-manager";

export default async function RemindersPage() {
  const { insforge, membership } = await getCurrentOrganizationContext();

  // Allow only admins, presidents, secretaries and treasurers
  if (!["organization_admin", "president", "secretaire", "tresorier", "gestionnaire"].includes(membership.role)) {
    redirect("/dashboard");
  }

  // Fetch contributions that are due (status = 'due') and not fully paid
  const { data: dueContributions } = await insforge
    .from("contributions")
    .select("member_profile_id, amount_due, amount_paid, member:member_profiles(first_name, last_name, phone)")
    .eq("organization_id", membership.organization_id)
    .eq("status", "due");

  // Aggregate debts by member
  const debtsMap = new Map();
  (dueContributions || []).forEach(c => {
    const memberId = c.member_profile_id;
    const debtAmount = (Number(c.amount_due) || 0) - (Number(c.amount_paid) || 0);
    
    if (debtAmount > 0) {
      if (!debtsMap.has(memberId)) {
        debtsMap.set(memberId, {
          memberId,
          firstName: (c.member as any)?.first_name || "Inconnu",
          lastName: (c.member as any)?.last_name || "",
          phone: (c.member as any)?.phone || "",
          totalDebt: 0,
          debtCount: 0
        });
      }
      
      const m = debtsMap.get(memberId);
      m.totalDebt += debtAmount;
      m.debtCount += 1;
    }
  });

  const aggregatedDebts = Array.from(debtsMap.values()).sort((a, b) => b.totalDebt - a.totalDebt);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <img src="/nayoora-logo.png" alt="" /> NAYOORA
        </Link>
        <div className="org-switch">
          <span>✉️</span>
          <div>
            <b>{(membership.organization as any)?.name}</b>
            <small>Messagerie</small>
          </div>
        </div>
        <nav>
          <Link href="/dashboard">◈ Vue d'ensemble</Link>
          <Link href="/dashboard/members">· Membres</Link>
          <Link href="/dashboard/finance">· Cotisations & Caisse</Link>
          <Link className="active" href="/dashboard/messages/reminders">· Relances</Link>
          <Link href="/dashboard/collections">· États & Retards</Link>
          <Link href="/dashboard/organigramme">· Organigramme</Link>
          <Link href="/portal/chat">· Chat interne</Link></nav>
      </aside>

      <section className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Communication</p>
            <h1>Relances automatisées</h1>
            <p>Envoyez des SMS ou Emails groupés aux membres ayant des arriérés.</p>
          </div>
        </header>

        <RemindersManager 
          debts={aggregatedDebts} 
          organizationId={membership.organization_id} 
        />
      </section>
    </main>
  );
}
