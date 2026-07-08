import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/insforge/server";
import { TreasuryReports } from "@/components/treasury-reports";

export default async function ReportsPage() {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) redirect('/login');

  const { data: m } = await s
    .from('organization_members')
    .select('organization_id, role, organization:organizations(name)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (!m) redirect('/onboarding');
  const orgId = m.organization_id;

  const [{ data: accounts }, { data: transactions }] = await Promise.all([
    s.from('cash_accounts').select('*').eq('organization_id', orgId).order('name'),
    s.from('cash_transactions')
      .select('id, direction, category, amount, notes, occurred_at, reference, cash_accounts(name)')
      .eq('organization_id', orgId)
      .order('occurred_at', { ascending: true }) // Ascending for ledger chronological order
  ]);

  return (
    <main className="app-shell">
      <aside className="sidebar print-hidden">
        <Link href="/dashboard" className="brand">
          <img src="/nayoora-logo.png" alt="" /> NAYOORA
        </Link>
        <div className="org-switch">
          <span>📊</span>
          <div>
            <b>{(m.organization as any)?.name}</b>
            <small>Rapports Financiers</small>
          </div>
        </div>
        <nav>
          <Link href="/dashboard">◈ Vue d'ensemble</Link>
          <Link href="/dashboard/members">· Membres</Link>
          <Link href="/dashboard/events">· Événements</Link>
          <Link href="/dashboard/messages">· Messages</Link>
          <Link href="/dashboard/documents">· Documents</Link>
          <Link className="active" href="/dashboard/treasury">· Trésorerie</Link>
          <Link href="/dashboard/projects">· Projets</Link>
          <Link href="/dashboard/organigramme">· Organigramme</Link>
        </nav>
      </aside>
      <section className="dashboard">
        <TreasuryReports 
          orgName={(m.organization as any)?.name || 'Organisation'}
          transactions={transactions || []}
        />
      </section>
    </main>
  );
}
