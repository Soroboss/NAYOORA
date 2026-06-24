import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/insforge/server";
import { MembersManager, type Member } from "@/components/members-manager";

export default async function MembersPage() {
  const insforge = await createClient(); const { data: { user } } = await insforge.auth.getUser(); if (!user) redirect("/login");
  const { data: membership } = await insforge.from("organization_members").select("organization:organizations(name),role,organization_id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle(); if (!membership) redirect("/onboarding");
  const { data: members } = await insforge.from("member_profiles").select("id,first_name,last_name,phone,email,member_number,status,birth_date,address").eq("organization_id", membership.organization_id).is("deleted_at", null).order("last_name");
  return <main className="app-shell"><aside className="sidebar"><Link href="/dashboard" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link><div className="org-switch"><span>◉</span><div><b>{(membership.organization as unknown as { name: string } | null)?.name}</b><small>Espace organisation</small></div></div><nav><Link href="/dashboard">◈ Vue d'ensemble</Link><Link className="active" href="/dashboard/members">· Membres</Link><a href="#">· Cotisations</a><a href="#">· Caisse</a><a href="#">· Rapports</a></nav></aside><section className="dashboard"><header className="dashboard-header"><div><p className="eyebrow">Répertoire</p><h1>Membres</h1><p>Gérez les personnes qui font vivre votre organisation.</p></div></header><MembersManager members={(members ?? []) as Member[]} canManage={["organization_admin","president","secretaire","gestionnaire"].includes(membership.role)} /></section></main>;
}
