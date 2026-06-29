import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MemberProfileManager } from "@/components/member-profile-manager";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { canManageMembers, getCurrentOrganizationContext } from "@/lib/current-organization";

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { insforge, membership, memberships } = await getCurrentOrganizationContext();
  const { data: member } = await insforge.from("member_profiles").select("id,organization_id,first_name,last_name,phone,email,address,member_number,status,birth_date,joined_on,photo_url,office_role,office_title,role_started_on,elected_until,is_current_officer,title,reports_to,member_cards(id,status,front_image_url,back_image_url,pdf_url,expires_at)").eq("organization_id", membership.organization_id).eq("id", id).is("deleted_at", null).maybeSingle();
  if (!member) notFound();
  const { data: elections } = await insforge.from("organization_elections").select("id,title,position,status,election_date,effective_on,notes,created_at").eq("organization_id", membership.organization_id).eq("elected_member_profile_id", id).order("created_at", { ascending: false }).limit(20);
  const { data: allMembers } = await insforge.from("member_profiles").select("id,first_name,last_name,title").eq("organization_id", membership.organization_id).is("deleted_at", null);
  return <main className="app-shell"><aside className="sidebar"><Link href="/dashboard" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link><div className="org-switch"><span>◉</span><div><b>{(membership.organization as any)?.name}</b><small>Profil membre</small></div></div><OrganizationSwitcher memberships={memberships} activeOrganizationId={membership.organization_id} /><nav><Link href="/dashboard">◈ Vue d'ensemble</Link><Link href="/dashboard/members">· Liste des membres</Link><Link href="/dashboard/members/new">· Créer un membre</Link><Link href="/dashboard/finance">· Cotisations</Link></nav></aside><section className="dashboard"><header className="dashboard-header"><div><p className="eyebrow">Profil membre</p><h1>{member.first_name} {member.last_name}</h1><p>Consultez les informations du membre et son rôle dans l’organisation active.</p></div><Link href="/dashboard/members" className="button">← Liste</Link></header>        <MemberProfileManager member={member} allMembers={allMembers ?? []} elections={elections ?? []} canManage={canManageMembers(membership.role)} orgName={(membership.organization as any)?.name} />
      </section>
    </main>;
}
