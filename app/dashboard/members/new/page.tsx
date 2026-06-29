import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberCreateForm } from "@/components/member-create-form";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { canManageMembers, getCurrentOrganizationContext } from "@/lib/current-organization";

export default async function NewMemberPage() {
  const { membership, memberships } = await getCurrentOrganizationContext();
  if (!canManageMembers(membership.role)) redirect("/dashboard/members");
  return <main className="app-shell"><aside className="sidebar"><Link href="/dashboard" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link><div className="org-switch"><span>◉</span><div><b>{(membership.organization as any)?.name}</b><small>Création membre</small></div></div><OrganizationSwitcher memberships={memberships} activeOrganizationId={membership.organization_id} /><nav><Link href="/dashboard">◈ Vue d'ensemble</Link><Link href="/dashboard/members">· Liste des membres</Link><Link className="active" href="/dashboard/members/new">· Créer un membre</Link><Link href="/dashboard/finance">· Cotisations</Link>
          <Link href="/dashboard/organigramme">· Organigramme</Link>
          <Link href="/portal/chat">· Chat interne</Link></nav></aside><section className="dashboard"><header className="dashboard-header"><div><p className="eyebrow">Membres</p><h1>Créer un membre</h1><p>Ajoutez une personne dans l’organisation active avec ses coordonnées, sa photo et son matricule automatique.</p></div></header><MemberCreateForm organizationId={membership.organization_id} /></section></main>;
}
