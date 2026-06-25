import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/insforge/server";
import { organizationTypes } from "@/lib/organization-config";
import type { Organization, OrganizationType } from "@/lib/types";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardPage() {
  const insforge = await createClient(); const { data: { user } } = await insforge.auth.getUser(); if (!user) redirect("/login");
  const { data: platformAdmin } = await insforge.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle(); if (platformAdmin) redirect("/platform");
  const { data: membership } = await insforge.from("organization_members").select("organization:organizations(id,name,slug,organization_type,currency)").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  const organization = membership?.organization as unknown as Organization | null; if (!organization) redirect("/onboarding");
  const config = organizationTypes[organization.organization_type as OrganizationType];
  const linkFor = (item: string) => ({
    "Membres": "/dashboard/members",
    "Cotisations": "/dashboard/finance",
    "Caisse": "/dashboard/treasury",
    "Finances": "/dashboard/finance",
    "Événements": "/dashboard/events",
    "Messages": "/dashboard/messages",
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
  }[item] ?? "/dashboard/insights");
  return <main className="app-shell"><aside className="sidebar"><Link href="/dashboard" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link><div className="org-switch"><span>{config.icon}</span><div><b>{organization.name}</b><small>{config.label}</small></div></div><nav><Link className="active" href="/dashboard"><i>◈</i>Vue d'ensemble</Link><Link href="/dashboard/members"><i>·</i>Membres</Link><Link href="/dashboard/finance"><i>·</i>Cotisations & Caisse</Link>{config.navigation.slice(2).map(item=><Link href={linkFor(item)} key={item}><i>·</i>{item}</Link>)}<Link href="/dashboard/support"><i>·</i>Support NAYOORA</Link></nav><Link className="settings" href="/dashboard/organization">⚙ Paramètres</Link><LogoutButton compact /></aside><section className="dashboard"><header className="dashboard-header"><div><p className="eyebrow">Vue d'ensemble</p><h1>Bonjour 👋</h1><p>Voici la situation de {organization.name} aujourd'hui.</p></div><Link href="/dashboard/members" className="button button-dark">+ Ajouter un membre</Link></header><div className="metric-grid">{config.metrics.map((metric) => <article className="metric-card" key={metric.label}><p>{metric.label}</p><strong>{metric.value}</strong>{metric.trend && <small>{metric.trend}</small>}<span className="metric-orbit" /></article>)}</div><div className="dashboard-grid"><article className="panel activity"><div className="panel-heading"><div><p className="eyebrow">Activité</p><h2>À suivre</h2></div><Link href="/dashboard/insights">Voir tout</Link></div><div className="empty-state"><div>⌁</div><h3>Votre espace est prêt.</h3><p>Ajoutez vos premiers membres et vos données commenceront à apparaître ici.</p></div></article><article className="panel quick-actions"><p className="eyebrow">Raccourcis</p><h2>Que souhaitez-vous faire ?</h2>{config.actions.map((action, i) => <Link href={linkFor(action)} key={action}><span>0{i + 1}</span>{action}<b>→</b></Link>)}</article></div></section></main>;
}
