import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/insforge/server";
import { AutomationsManager } from "@/components/automations-manager";

export default async function AutomationsPage() {
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

  const { data: rules } = await insforge
    .from("automation_rules")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at");

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link>
        <div className="org-switch">
          <span>⚙️</span>
          <div>
            <b>{(membership.organization as any)?.name}</b>
            <small>Configuration</small>
          </div>
        </div>
        <nav>
          <Link href="/dashboard">◈ Vue d'ensemble</Link>
          <Link href="/dashboard/settings">· Paramètres</Link>
          <Link className="active" href="/dashboard/automations">· Automatisations</Link>
          <Link href="/dashboard/organigramme">· Organigramme</Link>
          <Link href="/portal/chat">· Chat interne</Link></nav>
      </aside>

      <section className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Smart NAYOORA</p>
            <h1>Automatisations (Cron)</h1>
            <p>Configurez les règles pour que l'application travaille à votre place.</p>
          </div>
        </header>
        
        <AutomationsManager 
          rules={rules || []} 
          organizationId={organizationId} 
          canManage={["organization_admin", "president"].includes(membership.role)}
        />
      </section>
    </main>
  );
}
