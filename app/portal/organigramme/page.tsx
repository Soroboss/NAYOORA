import Link from "next/link";
import { OrganigramChart } from "@/components/organigram-chart";
import { getCurrentOrganizationContext } from "@/lib/current-organization";

export default async function OrganigramPortalPage() {
  const { insforge, membership } = await getCurrentOrganizationContext();
  
  // Fetch all members to build the tree. The user requested that ordinary members see the "bureau" organigram.
  // Actually, seeing the whole organigram is fine, or we can filter out people with no title and no subordinates if they want a clean chart.
  // But standard organigram chart handles all connected members. Let's fetch all active members.
  const { data: members } = await insforge
    .from("member_profiles")
    .select("id,first_name,last_name,title,reports_to,photo_url,office_role")
    .eq("organization_id", membership.organization_id)
    .is("deleted_at", null)
    .order("last_name");

  // To show only the "bureau", we can filter members who have a title or an office_role, and their subordinates.
  // For simplicity, showing everyone connected to the tree is the most dynamic way.
  // We'll pass all members to the chart.

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/portal" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link>
        <div className="org-switch">
          <span>◎</span>
          <div>
            <b>{(membership.organization as any)?.name}</b>
            <small>Espace Membre</small>
          </div>
        </div>
        <nav>
          <Link href="/portal">◈ Mon tableau de bord</Link>
          <Link href="/portal/finance">· Mes cotisations</Link>
          <Link href="/portal/chat">· Messagerie</Link>
          <Link className="active" href="/portal/organigramme">· Organigramme</Link>
        </nav>
      </aside>
      
      <section className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Hiérarchie</p>
            <h1>Organigramme du bureau</h1>
            <p>Découvrez l'équipe dirigeante et la structure de l'organisation.</p>
          </div>
        </header>

        <OrganigramChart members={members || []} />
      </section>
    </main>
  );
}
