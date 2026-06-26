import Link from "next/link";
import { redirect } from "next/navigation";
import { organizationTypes } from "@/lib/organization-config";
import type { Organization, OrganizationType } from "@/lib/types";
import { LogoutButton } from "@/components/logout-button";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { getCurrentOrganizationContext } from "@/lib/current-organization";

export default async function DashboardPage() {
  const { insforge, user, membership, memberships } = await getCurrentOrganizationContext();
  const { data: platformAdmin } = await insforge.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle(); if (platformAdmin) redirect("/platform");
  const organization = membership?.organization as unknown as Organization | null; if (!organization) redirect("/onboarding");
  const config = organizationTypes[organization.organization_type as OrganizationType];
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
  const [activeMembers,totalMembers,officers,payments,events] = await Promise.all([
    insforge.from("member_profiles").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).eq("status", "active").is("deleted_at", null),
    insforge.from("member_profiles").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).is("deleted_at", null),
    insforge.from("member_profiles").select("first_name,last_name,office_role").eq("organization_id", organization.id).eq("is_current_officer", true).is("deleted_at", null).limit(20),
    insforge.from("payments").select("amount").eq("organization_id", organization.id).eq("status", "confirmed").gte("paid_at", startOfMonth.toISOString()),
    insforge.from("events").select("id").eq("organization_id", organization.id).gte("starts_at", new Date().toISOString()),
  ]);
  const paidThisMonth = (payments.data ?? []).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const president = (officers.data ?? []).find((member: any) => member.office_role === "president");
  const formatMoney = (amount: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: organization.currency || "XOF", maximumFractionDigits: 0 }).format(amount);
  const liveMetrics = [
    { label: "Membres actifs", value: String(activeMembers.count ?? 0), trend: `${totalMembers.count ?? 0} inscrit(s) au total` },
    { label: "Bureau actif", value: String((officers.data ?? []).length), trend: president ? `Président : ${president.first_name} ${president.last_name}` : "Président à définir" },
    { label: "Cotisations encaissées", value: formatMoney(paidThisMonth), trend: "Mois en cours" },
    { label: "Événements à venir", value: String(events.data?.length ?? 0), trend: "Calendrier organisation" },
  ];
  const linkFor = (item: string) => ({
    "Membres": "/dashboard/members",
    "Ajouter un membre": "/dashboard/members/new",
    "Cotisations": "/dashboard/finance",
    "Caisse": "/dashboard/treasury",
    "Finances": "/dashboard/finance",
    "Événements": "/dashboard/events",
    "Créer un événement": "/dashboard/events",
    "Réunions": "/dashboard/events",
    "Messages": "/dashboard/messages",
    "Envoyer un message": "/dashboard/messages",
    "Rapports": "/dashboard/reports",
    "Tontine": "/dashboard/tontine",
    "Prêts": "/dashboard/credit",
    "Solidarité": "/dashboard/solidarity",
    "Mobile Money": "/dashboard/mobile-money",
    "Gouvernance": "/dashboard/governance",
    "Gestion Orga": "/dashboard/organization",
    "Support": "/dashboard/support",
    "Projets": "/dashboard/ngo",
    "Impact": "/dashboard/ngo/impact",
    "Coopérative": "/dashboard/cooperative",
    "Syndicat": "/dashboard/union",
    "Terrain": "/dashboard/political/field",
    "Recrutement": "/dashboard/recruitment",
  }[item] ?? "/dashboard/insights");
  return <main className="app-shell"><aside className="sidebar"><Link href="/dashboard" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link><div className="org-switch"><span>{config.icon}</span><div><b>{organization.name}</b><small>{config.label}</small></div></div><OrganizationSwitcher memberships={memberships} activeOrganizationId={membership.organization_id} /><nav><Link className="active" href="/dashboard"><i>◈</i>Vue d'ensemble</Link><Link href="/dashboard/members"><i>·</i>Membres</Link><Link href="/dashboard/members/new"><i>·</i>Ajouter un membre</Link><Link href="/dashboard/recruitment"><i>·</i>Recrutement</Link><Link href="/dashboard/finance"><i>·</i>Cotisations & Caisse</Link>{config.navigation.slice(2).map(item=><Link href={linkFor(item)} key={item}><i>·</i>{item}</Link>)}<Link href="/dashboard/support"><i>·</i>Support NAYOORA</Link></nav><Link className="settings" href="/dashboard/organization">⚙ Paramètres</Link><LogoutButton compact /></aside><section className="dashboard"><header className="dashboard-header"><div><p className="eyebrow">Vue d'ensemble</p><h1>Bonjour 👋</h1><p>Voici la situation réelle de {organization.name} aujourd'hui.</p></div><Link href="/dashboard/members/new" className="button button-dark">+ Ajouter un membre</Link></header><div className="metric-grid">{liveMetrics.map((metric) => <article className="metric-card" key={metric.label}><p>{metric.label}</p><strong>{metric.value}</strong>{metric.trend && <small>{metric.trend}</small>}<span className="metric-orbit" /></article>)}</div><div className="dashboard-grid"><article className="panel activity"><div className="panel-heading"><div><p className="eyebrow">Activité</p><h2>À suivre</h2></div><Link href="/dashboard/insights">Voir tout</Link></div><div className="empty-state"><div>⌁</div><h3>Données synchronisées.</h3><p>Les membres, paiements, événements et fonctions du bureau se mettent à jour automatiquement.</p></div></article><article className="panel quick-actions"><p className="eyebrow">Raccourcis</p><h2>Que souhaitez-vous faire ?</h2>{config.actions.map((action, i) => <Link href={linkFor(action)} key={action}><span>0{i + 1}</span>{action}<b>→</b></Link>)}</article></div></section></main>;
}
