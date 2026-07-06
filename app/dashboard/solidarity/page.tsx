import Link from "next/link";
import { getCurrentOrganizationContext } from "@/lib/current-organization";
import { SolidarityManager } from "@/components/solidarity-manager";

export default async function SolidarityPage() {
  const { insforge, membership } = await getCurrentOrganizationContext();
  const organizationId = membership.organization_id;
  const [members, cases, disbursements] = await Promise.all([
    insforge.from("member_profiles").select("id,first_name,last_name,phone").eq("organization_id", organizationId).is("deleted_at", null).eq("status", "active").order("last_name"),
    insforge.from("solidarity_cases").select("id,title,case_type,requested_amount,approved_amount,status,member:member_profiles(first_name,last_name,phone)").eq("organization_id", organizationId).order("requested_at", { ascending: false }),
    insforge.from("disbursements").select("id,amount,disbursed_at,notes,beneficiary:member_profiles(first_name,last_name,phone),solidarity_case:solidarity_cases(title)").eq("organization_id", organizationId).not("solidarity_case_id", "is", null).order("disbursed_at", { ascending: false }).limit(50),
  ]);
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link>
        <div className="org-switch"><span>♥</span><div><b>{(membership.organization as any)?.name}</b><small>Solidarité</small></div></div>
        <nav><Link href="/dashboard">◈ Vue d'ensemble</Link><Link href="/dashboard/members">· Membres</Link><Link href="/dashboard/finance">· Cotisations & Caisse</Link><Link href="/dashboard/credit">· Prêts & Créances</Link><Link className="active" href="/dashboard/solidarity">· Aides & soutiens</Link><Link href="/dashboard/organigramme">· Organigramme</Link></nav>
      </aside>
      <section className="dashboard">
        <header className="dashboard-header"><div><p className="eyebrow">Fonds de solidarité</p><h1>Aides & soutiens aux membres</h1><p>Enregistrez chaque aide, son bénéficiaire, son montant et sa remise effective.</p></div></header>
        <SolidarityManager members={members.data ?? []} cases={cases.data ?? []} disbursements={disbursements.data ?? []} canManage={["organization_admin", "president", "tresorier"].includes(membership.role)} />
      </section>
    </main>
  );
}
