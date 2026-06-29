import Link from "next/link";
import { OrganigramChart } from "@/components/organigram-chart";
import { cookies } from "next/headers";
import { createAdminClient as createClient } from "@/lib/insforge/server";
import { redirect } from "next/navigation";

export default async function OrganigramPortalPage(props: { params: Promise<{ orgSlug: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies();
  const sessionString = cookieStore.get("portal_session")?.value;
  if (!sessionString) redirect("/portal/login");
  let session;
  try { session = JSON.parse(sessionString); } catch { redirect("/portal/login"); }

  const insforge = await createClient();

  const { data: member } = await insforge
    .from("member_profiles")
    .select("organization_id, organization:organizations!member_profiles_organization_id_fkey(name)")
    .eq("id", session.memberId)
    .single();

  if (!member) redirect("/api/portal/auth/logout");

  const { data: members } = await insforge
    .from("member_profiles")
    .select("id,first_name,last_name,title,reports_to,photo_url,office_role")
    .eq("organization_id", member.organization_id)
    .is("deleted_at", null)
    .order("last_name");

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href={`/portal/${params.orgSlug}`} className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link>
        <div className="org-switch">
          <span>◎</span>
          <div>
            <b>{(member.organization as any)?.name}</b>
            <small>Espace Membre</small>
          </div>
        </div>
        <nav>
          <Link href={`/portal/${params.orgSlug}`}>◈ Mon tableau de bord</Link>
          <Link href={`/portal/${params.orgSlug}/finance`}>· Mes cotisations</Link>
          <Link href={`/portal/${params.orgSlug}/chat`}>· Messagerie</Link>
          <Link className="active" href={`/portal/${params.orgSlug}/organigramme`}>· Organigramme</Link>
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
