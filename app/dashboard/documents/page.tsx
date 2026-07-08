import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/insforge/server';
import { DocumentsManager } from '@/components/documents-manager';

export default async function DocumentsPage() {
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

  const { data: documents } = await s
    .from('documents')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <img src="/nayoora-logo.png" alt="" /> NAYOORA
        </Link>
        <div className="org-switch">
          <span>📁</span>
          <div>
            <b>{(m.organization as any)?.name}</b>
            <small>Documents & Archives</small>
          </div>
        </div>
        <nav>
          <Link href="/dashboard">◈ Vue d'ensemble</Link>
          <Link href="/dashboard/members">· Membres</Link>
          <Link href="/dashboard/events">· Événements</Link>
          <Link href="/dashboard/messages">· Messages</Link>
          <Link className="active" href="/dashboard/documents">· Documents</Link>
          <Link href="/dashboard/projects">· Projets</Link>
          <Link href="/dashboard/organigramme">· Organigramme</Link>
          <Link href="/portal/chat">· Chat interne</Link>
        </nav>
      </aside>
      <section className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Gestion Documentaire</p>
            <h1>Documents & Archives</h1>
            <p>Stockez, organisez et partagez vos statuts, règlements intérieurs, PV d'AG et reçus.</p>
          </div>
        </header>
        
        <DocumentsManager 
          documents={documents ?? []} 
          canManage={["organization_admin", "president", "secretaire", "gestionnaire"].includes(m.role)} 
          orgId={orgId} 
        />
      </section>
    </main>
  );
}
