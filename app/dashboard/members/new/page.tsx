import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/insforge/server";
import { MemberCreateForm } from "@/components/member-create-form";

export default async function NewMemberPage() {
  const insforge = await createClient(); const { data: { user } } = await insforge.auth.getUser(); if (!user) redirect("/login");
  const { data: membership } = await insforge.from("organization_members").select("organization:organizations(name),role,organization_id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle(); if (!membership) redirect("/onboarding");
  if (!["organization_admin","president","secretaire","gestionnaire"].includes(membership.role)) redirect("/dashboard/members");
  return <main className="app-shell"><aside className="sidebar"><Link href="/dashboard" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link><div className="org-switch"><span>◉</span><div><b>{(membership.organization as any)?.name}</b><small>Création membre</small></div></div><nav><Link href="/dashboard">◈ Vue d'ensemble</Link><Link href="/dashboard/members">· Liste des membres</Link><Link className="active" href="/dashboard/members/new">· Créer un membre</Link><Link href="/dashboard/finance">· Cotisations</Link></nav></aside><section className="dashboard"><header className="dashboard-header"><div><p className="eyebrow">Membres</p><h1>Créer un membre</h1><p>Ajoutez une personne avec ses coordonnées, sa photo et son matricule automatique.</p></div></header><MemberCreateForm organizationId={membership.organization_id} /></section></main>;
}
