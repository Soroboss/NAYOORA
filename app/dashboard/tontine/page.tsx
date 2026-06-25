import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/insforge/server";
import { TontineManager } from "@/components/tontine-manager";

export default async function TontinePage() {
  const insforge = await createClient();
  const { data: { user } } = await insforge.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await insforge.from("organization_members").select("organization_id,role,organization:organizations(name)").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (!membership) redirect("/onboarding");
  const organizationId = membership.organization_id;
  const [groups, participants, cycles, collections, payouts] = await Promise.all([
    insforge.from("tontine_groups").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    insforge.from("tontine_participants").select("*").eq("organization_id", organizationId).order("payout_rank"),
    insforge.from("tontine_cycles").select("*,beneficiary:tontine_participants(display_name,payout_rank)").eq("organization_id", organizationId).order("cycle_number"),
    insforge.from("tontine_collections").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
    insforge.from("tontine_payouts").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);
  return <main className="app-shell"><aside className="sidebar"><Link href="/dashboard" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link><div className="org-switch"><span>◍</span><div><b>{(membership.organization as any)?.name}</b><small>Tontine</small></div></div><nav><Link href="/dashboard">◈ Vue d'ensemble</Link><Link href="/dashboard/members">· Participants</Link><Link className="active" href="/dashboard/tontine">· Tontine</Link><Link href="/dashboard/finance">· Cotisations & Caisse</Link><Link href="/dashboard/treasury">· Trésorerie</Link><Link href="/dashboard/reports">· Rapports</Link></nav></aside><section className="dashboard"><header className="dashboard-header"><div><p className="eyebrow">Module Tontine</p><h1>Tours, encaissements & reversements</h1><p>Gérez l’argent, les bénéficiaires par rang, les périodes d’encaissement, les reversements et les commissions.</p></div></header><TontineManager groups={groups.data ?? []} participants={participants.data ?? []} cycles={cycles.data ?? []} collections={collections.data ?? []} payouts={payouts.data ?? []} canManage={["organization_admin", "president", "tresorier", "gestionnaire"].includes(membership.role)} /></section></main>;
}
