import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/insforge/server";
import { GovernanceManager } from "@/components/governance-manager";

export default async function GovernancePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const insforge = await createClient();
  const { data: { user } } = await insforge.auth.getUser();
  if (!user) redirect("/login");
  
  const { data: membership } = await insforge
    .from("organization_members")
    .select("organization_id,role,organization:organizations(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
    
  if (!membership) redirect("/onboarding");
  const organizationId = membership.organization_id;
  
  const params = await searchParams;
  const currentTab = params.tab || "documents";

  const [documents, reports, logs, elections, candidates] = await Promise.all([
    insforge.from("documents").select("id,title,mime_type,size_bytes,created_at,visibility").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(20),
    insforge.from("reports").select("id,title,report_type,parameters,generated_at").eq("organization_id", organizationId).order("generated_at", { ascending: false }).limit(20),
    insforge.from("audit_logs").select("id,action,entity_type,created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(20),
    insforge.from("elections").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    insforge.from("election_candidates").select("*, member:member_profiles(first_name, last_name, phone)").in("election_id", (await insforge.from("elections").select("id").eq("organization_id", organizationId)).data?.map(e => e.id) || [])
  ]);

  const { data: members } = await insforge.from("member_profiles").select("id,first_name,last_name").eq("organization_id", organizationId).is("deleted_at", null);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link>
        <div className="org-switch">
          <span>⚖️</span>
          <div>
            <b>{(membership.organization as any)?.name}</b>
            <small>Gouvernance</small>
          </div>
        </div>
        <nav>
          <Link href="/dashboard">◈ Vue d'ensemble</Link>
          <Link href="/dashboard/members">· Membres</Link>
          <Link href="/dashboard/messages">· Messages</Link>
          <Link className="active" href="/dashboard/governance">· Assemblée & Élections</Link>
          <Link href="/dashboard/organigramme">· Organigramme</Link>
          <Link href="/portal/chat">· Chat interne</Link></nav>
      </aside>

      <section className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Gouvernance</p>
            <h1>Assemblée & Élections</h1>
            <p>Gérez les PV de réunions, les documents importants et le vote électronique.</p>
          </div>
        </header>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
          <Link 
            href="/dashboard/governance?tab=documents" 
            style={{ 
              padding: '8px 16px', 
              borderRadius: '6px', 
              backgroundColor: currentTab === 'documents' ? '#f3f4f6' : 'transparent',
              fontWeight: currentTab === 'documents' ? '600' : '400',
              color: currentTab === 'documents' ? '#111827' : '#6b7280',
              textDecoration: "none"
            }}
          >
            Documents & PV
          </Link>
          <Link 
            href="/dashboard/governance?tab=elections" 
            style={{ 
              padding: '8px 16px', 
              borderRadius: '6px', 
              backgroundColor: currentTab === 'elections' ? '#f3f4f6' : 'transparent',
              fontWeight: currentTab === 'elections' ? '600' : '400',
              color: currentTab === 'elections' ? '#111827' : '#6b7280',
              textDecoration: "none"
            }}
          >
            Vote Électronique
          </Link>
        </div>

        <GovernanceManager 
          tab={currentTab}
          organizationId={organizationId} 
          documents={documents.data || []} 
          reports={reports.data || []} 
          logs={logs.data || []} 
          elections={elections.data || []}
          candidates={candidates.data || []}
          members={members || []}
          canManage={["organization_admin", "president", "secretaire", "gestionnaire"].includes(membership.role)}
        />
      </section>
    </main>
  );
}
