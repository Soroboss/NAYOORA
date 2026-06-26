import Link from "next/link";
import { MembersDirectory, type DirectoryMember } from "@/components/members-directory";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { canManageMembers, getCurrentOrganizationContext } from "@/lib/current-organization";

export default async function MembersPage() {
  const { insforge, membership, memberships } = await getCurrentOrganizationContext();
  const { data: members } = await insforge.from("member_profiles").select("id,first_name,last_name,phone,email,member_number,status,office_role,office_title,photo_url").eq("organization_id", membership.organization_id).is("deleted_at", null).order("last_name");
  return <main className="app-shell"><aside className="sidebar"><Link href="/dashboard" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link><div className="org-switch"><span>◉</span><div><b>{(membership.organization as unknown as { name: string } | null)?.name}</b><small>Espace organisation</small></div></div><OrganizationSwitcher memberships={memberships} activeOrganizationId={membership.organization_id} /><nav><Link href="/dashboard">◈ Vue d'ensemble</Link><Link className="active" href="/dashboard/members">· Liste des membres</Link><Link href="/dashboard/members/new">· Créer un membre</Link><Link href="/dashboard/recruitment">· Recrutement</Link><Link href="/dashboard/finance">· Cotisations</Link><Link href="/dashboard/treasury">· Caisse</Link><Link href="/dashboard/reports">· Rapports</Link></nav></aside><section className="dashboard"><header className="dashboard-header"><div><p className="eyebrow">Répertoire</p><h1>Liste des membres</h1><p>Consultez les membres de l’organisation active et ouvrez leur fiche détaillée.</p></div></header><MembersDirectory members={(members ?? []) as DirectoryMember[]} canManage={canManageMembers(membership.role)} /></section></main>;
}
