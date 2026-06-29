import Link from "next/link";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { OrganigramChart } from "@/components/organigram-chart";
import { canManageMembers, getCurrentOrganizationContext } from "@/lib/current-organization";

export default async function OrganigramDashboardPage() {
  const { insforge, membership, memberships } = await getCurrentOrganizationContext();
  
  // Fetch all members to build the tree
  const { data: members } = await insforge
    .from("member_profiles")
    .select("id,first_name,last_name,title,reports_to,photo_url,office_role")
    .eq("organization_id", membership.organization_id)
    .is("deleted_at", null)
    .order("last_name");

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link>
        <div className="org-switch">
          <span>◉</span>
          <div>
            <b>{(membership.organization as any)?.name}</b>
            <small>Organigramme</small>
          </div>
        </div>
        <OrganizationSwitcher memberships={memberships} activeOrganizationId={membership.organization_id} />
        <nav>
          <Link href="/dashboard">◈ Vue d'ensemble</Link>
          <Link href="/dashboard/members">· Liste des membres</Link>
          <Link href="/dashboard/members/new">· Créer un membre</Link>
          <Link className="active" href="/dashboard/organigramme">· Organigramme</Link>
          <Link href="/dashboard/finance">· Cotisations</Link>
          <Link href="/portal/chat">· Chat interne</Link></nav>
      </aside>
      
      <section className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Hiérarchie</p>
            <h1>Organigramme</h1>
            <p>Visualisation de la structure de l'organisation.</p>
          </div>
        </header>

        <OrganigramChart members={members || []} />
      </section>
    </main>
  );
}
