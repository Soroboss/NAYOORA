import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentOrganizationContext } from '@/lib/current-organization';
import { MobileMoneyManager } from '@/components/mobile-money-manager';

export default async function MobileMoneyPage() {
  const { insforge, membership } = await getCurrentOrganizationContext();

  // Allow only admins, presidents, and treasurers
  if (!['organization_admin', 'president', 'tresorier'].includes(membership.role)) {
    redirect('/dashboard');
  }

  // Fetch existing Mobile Money accounts
  const { data: accounts } = await insforge
    .from('cash_accounts')
    .select('*')
    .eq('organization_id', membership.organization_id)
    .eq('account_type', 'mobile_money')
    .order('name');

  // Fetch recent payments that might be linked to mobile money
  const { data: recentPayments } = await insforge
    .from('payments')
    .select('id, amount, provider, provider_reference, status, paid_at, member:member_profiles(first_name, last_name)')
    .eq('organization_id', membership.organization_id)
    .in('provider', ['orange_money', 'wave', 'mtn_momo', 'moov_money', 'mobile_money'])
    .order('paid_at', { ascending: false })
    .limit(50);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <img src="/nayoora-logo.png" alt="" /> NAYOORA
        </Link>
        <div className="org-switch">
          <span>◉</span>
          <div>
            <b>{(membership.organization as any)?.name}</b>
            <small>Finance Mobile</small>
          </div>
        </div>
        <nav>
          <Link href="/dashboard">◈ Vue d'ensemble</Link>
          <Link href="/dashboard/finance">· Cotisations & Caisse</Link>
          <Link className="active" href="/dashboard/mobile-money">· Mobile Money</Link>
          <Link href="/dashboard/administration">· Paramètres</Link>
          <Link href="/dashboard/organigramme">· Organigramme</Link>
          <Link href="/portal/chat">· Chat interne</Link></nav>
      </aside>

      <section className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Finance Mobile</p>
            <h1>Gestion Mobile Money</h1>
            <p>Configurez vos numéros de réception et suivez les versements mobiles.</p>
          </div>
        </header>

        <MobileMoneyManager 
          organizationId={membership.organization_id} 
          accounts={accounts || []} 
          recentPayments={recentPayments || []} 
          canManage={true}
        />
      </section>
    </main>
  );
}
