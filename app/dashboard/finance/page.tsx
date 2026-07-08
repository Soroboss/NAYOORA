import Link from "next/link";
import { FinanceManager } from "@/components/finance-manager";
import { getCurrentOrganizationContext } from "@/lib/current-organization";


export default async function FinancePage() {
  const { insforge, membership } = await getCurrentOrganizationContext();
  const org = membership.organization_id;

  const [plans, members, contributions, payments, pendingPayments, cash] = await Promise.all([
    insforge.from('contribution_plans').select('id,name,amount,frequency,start_date,end_date,active,notes').eq('organization_id', org).order('created_at', { ascending: false }),
    insforge.from('member_profiles').select('id,first_name,last_name,phone').eq('organization_id', org).is('deleted_at', null).eq('status', 'active').order('last_name'),
    insforge.from('contributions').select('id,amount_due,amount_paid,due_date,status,member:member_profiles(first_name,last_name,phone),plan:contribution_plans(name)').eq('organization_id', org).order('due_date', { ascending: false }).limit(12),
    insforge.from('payments').select('id,amount,paid_at,provider,member_profile_id,member:member_profiles(first_name,last_name,phone)').eq('organization_id', org).eq('status', 'confirmed').order('paid_at', { ascending: false }).limit(8),
    insforge.from('payments').select('id,amount,created_at,provider,provider_reference,proof_url,contribution_plan_id,member:member_profiles(first_name,last_name,phone),contribution:contributions(id,due_date,amount_due),plan:contribution_plans(name)').eq('organization_id', org).eq('status', 'pending').order('created_at', { ascending: false }),
    insforge.from('cash_transactions').select('id,direction,category,amount,occurred_at').eq('organization_id', org).eq('status', 'posted').order('occurred_at', { ascending: false }).limit(8)
  ]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link>
        <div className="org-switch">
          <span>◉</span>
          <div><b>{(membership.organization as any)?.name}</b><small>Trésorerie</small></div>
        </div>
        <nav>
          <Link href="/dashboard">◈ Vue d'ensemble</Link>
          <Link href="/dashboard/members">· Membres</Link>
          <Link className="active" href="/dashboard/finance">· Cotisations & Caisse</Link>
          <Link href="/dashboard/solidarity">· Aides & soutiens</Link>
          <a href="#">· Rapports</a>
        </nav>
      </aside>
      <section className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Finance</p>
            <h1>Cotisations & caisse</h1>
            <p>Suivez les échéances, encaissements et mouvements de trésorerie.</p>
          </div>
        </header>
        <FinanceManager 
          plans={plans.data ?? []} 
          members={members.data ?? []} 
          contributions={contributions.data ?? []} 
          payments={payments.data ?? []} 
          pendingPayments={pendingPayments.data ?? []}
          cash={cash.data ?? []} 
          canManage={["organization_admin", "president", "tresorier"].includes(membership.role)} 
          orgName={(membership.organization as any)?.name}
          orgType={(membership.organization as any)?.organization_type}
        />
      </section>
    </main>
  );
}
