import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/insforge/server";
import { SupportManager } from "@/components/support-manager";
import { LogoutButton } from "@/components/logout-button";

export default async function SupportPage() {
  const insforge = await createClient();
  const { data: { user } } = await insforge.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await insforge.from("organization_members").select("organization_id,role,organization:organizations(name)").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (!membership) redirect("/onboarding");
  const { data: requests } = await insforge.from("platform_requests").select("id,title,request_type,priority,status,description,resolution,created_at,updated_at").eq("organization_id", membership.organization_id).order("created_at", { ascending: false });
  return <main className="app-shell"><aside className="sidebar"><Link href="/dashboard" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link><div className="org-switch"><span>?</span><div><b>{(membership.organization as any)?.name}</b><small>Support</small></div></div><nav><Link href="/dashboard">◈ Vue d'ensemble</Link><Link href="/dashboard/organization">· Paramètres</Link><Link className="active" href="/dashboard/support">· Support NAYOORA</Link></nav><LogoutButton compact /></aside><section className="dashboard"><header className="dashboard-header"><div><p className="eyebrow">Requêtes</p><h1>Support NAYOORA</h1><p>Envoyez une demande aux propriétaires du SaaS et suivez la réponse.</p></div></header><SupportManager requests={requests ?? []} canManage={["organization_admin","president","secretaire","tresorier","gestionnaire"].includes(membership.role)} /></section></main>;
}
