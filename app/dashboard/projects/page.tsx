import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/insforge/server";
import { ProjectsManager } from "@/components/projects-manager";

export default async function ProjectsPage() {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) redirect("/login");

  const { data: m } = await s
    .from("organization_members")
    .select("organization_id, role, organization:organizations(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!m) redirect("/onboarding");

  const { data: projects } = await s
    .from("projects")
    .select("*")
    .eq("organization_id", m.organization_id)
    .order("created_at", { ascending: false });

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <img src="/nayoora-logo.png" alt="" /> NAYOORA
        </Link>
        <div className="org-switch">
          <span>◉</span>
          <div>
            <b>{(m.organization as any)?.name}</b>
            <small>Projets & Rapports</small>
          </div>
        </div>
        <nav>
          <Link href="/dashboard">◈ Vue d'ensemble</Link>
          <Link href="/dashboard/members">· Membres</Link>
          <Link href="/dashboard/events">· Événements</Link>
          <Link href="/dashboard/messages">· Messages</Link>
          <Link className="active" href="/dashboard/projects">· Projets</Link>
          <Link href="/dashboard/organigramme">· Organigramme</Link>
          <Link href="/portal/chat">· Chat interne</Link></nav>
      </aside>
      <section className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Gestion</p>
            <h1>Projets</h1>
            <p>Créez et suivez l'avancement de vos projets d'organisation.</p>
          </div>
        </header>
        <ProjectsManager projects={projects ?? []} canManage={["organization_admin", "president", "secretaire", "gestionnaire"].includes(m.role)} />
      </section>
    </main>
  );
}
