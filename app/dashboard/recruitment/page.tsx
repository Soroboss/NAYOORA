import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/insforge/server';
import { RecruitmentManager } from '@/components/recruitment-manager';

export default async function RecruitmentPage() {
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
  
  if (!['organization_admin', 'president'].includes(m.role)) {
    redirect('/dashboard');
  }

  const o = m.organization_id;

  const [formRes, requestsRes] = await Promise.all([
    s.from('registration_forms').select('*').eq('organization_id', o).maybeSingle(),
    s.from('registration_requests').select('*').eq('organization_id', o).eq('status', 'pending').order('submitted_at', { ascending: false })
  ]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <img src="/nayoora-logo.png" alt="" /> NAYOORA
        </Link>
        <div className="org-switch">
          <span>◈</span>
          <div>
            <b>{(m.organization as any)?.name}</b>
            <small>Gestion des recrutements</small>
          </div>
        </div>
        <nav>
          <Link href="/dashboard">◈ Vue d'ensemble</Link>
          <Link href="/dashboard/members">· Liste des membres</Link>
          <Link className="active" href="/dashboard/recruitment">· Formulaire & Adhésion</Link>
          <Link href="/dashboard/organization">· Gestion Orga</Link>
          <Link href="/dashboard/organigramme">· Organigramme</Link>
          <Link href="/portal/chat">· Chat interne</Link></nav>
      </aside>
      
      <section className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Recrutement</p>
            <h1>Adhésion publique</h1>
            <p>Gérez le formulaire d'inscription et validez les nouvelles demandes de membres.</p>
          </div>
        </header>
        
        <RecruitmentManager form={formRes.data} requests={requestsRes.data || []} />
      </section>
    </main>
  );
}
