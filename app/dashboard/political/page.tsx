import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/insforge/server";
import { PoliticalManager } from "@/components/political-manager";

export default async function PoliticalPage() {
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
  
  const [federations, sections, campaigns, members] = await Promise.all([
    insforge.from("federations").select("id,name,region").eq("organization_id", organizationId).order("name"),
    insforge.from("local_sections").select("id,name,locality,federation:federations(name)").eq("organization_id", organizationId).order("name"),
    insforge.from("campaigns").select("id,name,status,starts_at,ends_at").eq("organization_id", organizationId).order("starts_at", { ascending: false }),
    insforge.from("member_profiles").select("id,first_name,last_name,address,phone").eq("organization_id", organizationId).is("deleted_at", null)
  ]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link>
        <div className="org-switch">
          <span>🗳️</span>
          <div>
            <b>{(membership.organization as any)?.name}</b>
            <small>Organisation politique</small>
          </div>
        </div>
        <nav>
          <Link href="/dashboard">◈ Vue d'ensemble</Link>
          <Link href="/dashboard/members">· Militants & Électeurs</Link>
          <Link className="active" href="/dashboard/political">· Cartographie Terrain</Link>
          <Link href="/dashboard/events">· Meetings</Link>
        </nav>
      </aside>
      
      <section className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Parti politique</p>
            <h1>Cartographie & Campagnes</h1>
            <p>Structurez les fédérations, animez les sections locales et cartographiez vos militants.</p>
          </div>
        </header>
        
        <PoliticalManager 
          federations={federations.data ?? []} 
          sections={sections.data ?? []} 
          campaigns={campaigns.data ?? []} 
          members={members.data ?? []}
          canManage={["organization_admin", "president", "secretaire", "gestionnaire"].includes(membership.role)}
        />
      </section>
    </main>
  );
}
