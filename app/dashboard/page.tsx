import Link from "next/link";
import { redirect } from "next/navigation";
import { organizationTypes } from "@/lib/organization-config";
import type { Organization, OrganizationType } from "@/lib/types";
import { LogoutButton } from "@/components/logout-button";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { getCurrentOrganizationContext } from "@/lib/current-organization";
import { DashboardCharts } from "@/components/dashboard-charts";
import { RecentActivity } from "@/components/recent-activity";

export default async function DashboardPage() {
  const { insforge, user, membership, memberships } = await getCurrentOrganizationContext();
  const { data: platformAdmin } = await insforge.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle(); 
  if (platformAdmin) redirect("/platform");
  
  const organization = membership?.organization as unknown as Organization | null; 
  if (!organization) redirect("/onboarding");
  
  const config = organizationTypes[organization.organization_type as OrganizationType];
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
  
  // Fetch core metrics
  const [activeMembers, totalMembers, officers, payments, events] = await Promise.all([
    insforge.from("member_profiles").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).eq("status", "active").is("deleted_at", null),
    insforge.from("member_profiles").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).is("deleted_at", null),
    insforge.from("member_profiles").select("first_name,last_name,office_role").eq("organization_id", organization.id).eq("is_current_officer", true).is("deleted_at", null).limit(20),
    insforge.from("payments").select("amount").eq("organization_id", organization.id).eq("status", "confirmed").gte("paid_at", startOfMonth.toISOString()),
    insforge.from("events").select("id").eq("organization_id", organization.id).gte("starts_at", new Date().toISOString()),
  ]);

  // Fetch recent activity data
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const [recentMembersRes, recentPaymentsRes, allRecentPayments] = await Promise.all([
    insforge.from("member_profiles").select("first_name, last_name, created_at").eq("organization_id", organization.id).order("created_at", { ascending: false }).limit(5),
    insforge.from("payments").select("amount, paid_at, member:member_profiles(first_name, last_name)").eq("organization_id", organization.id).eq("status", "confirmed").order("paid_at", { ascending: false }).limit(5),
    insforge.from("payments").select("amount, paid_at").eq("organization_id", organization.id).eq("status", "confirmed").gte("paid_at", sixMonthsAgo.toISOString())
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

  // Format activities
  const activities: { type: string; description: string; date: string }[] = [];
  if (recentMembersRes.data) {
    activities.push(...recentMembersRes.data.map(m => ({ type: 'member', description: `Nouveau membre: ${m.first_name} ${m.last_name}`, date: m.created_at })));
  }
  if (recentPaymentsRes.data) {
    activities.push(...recentPaymentsRes.data.map(p => ({ type: 'payment', description: `Paiement reçu: ${formatMoney(p.amount)} de ${(p.member as any)?.first_name || 'Inconnu'}`, date: p.paid_at })));
  }
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const finalActivities = activities.slice(0, 5);

  // Format charts (last 6 months)
  const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const chartDataMap: Record<string, number> = {};
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
    chartDataMap[key] = 0;
  }

  (allRecentPayments.data || []).forEach(p => {
    const d = new Date(p.paid_at);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
    if (chartDataMap[key] !== undefined) {
      chartDataMap[key] += Number(p.amount || 0);
    }
  });

  const chartData = Object.entries(chartDataMap).map(([label, value]) => ({ label, value }));

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <img src="/nayoora-logo.png" alt="" /> NAYOORA
        </Link>
        <div className="org-switch">
          <span>{config.icon}</span>
          <div>
            <b>{organization.name}</b>
            <small>{config.label}</small>
          </div>
        </div>
        <OrganizationSwitcher memberships={memberships} activeOrganizationId={membership.organization_id} />
        <nav>
          <Link className="active" href="/dashboard"><i>◈</i>Vue d'ensemble</Link>
          <Link href="/dashboard/members"><i>·</i>Membres</Link>
          <Link href="/dashboard/members/new"><i>·</i>Ajouter un membre</Link>
          <Link href="/dashboard/recruitment"><i>·</i>Recrutement</Link>
          <Link href="/dashboard/finance"><i>·</i>Cotisations & Caisse</Link>
          {config.navigation.slice(2).map(item=><Link href={linkFor(item)} key={item}><i>·</i>{item}</Link>)}
          <Link href="/dashboard/support"><i>·</i>Support NAYOORA</Link>
        </nav>
        <Link className="settings" href="/dashboard/organization">⚙ Paramètres</Link>
        <LogoutButton compact />
      </aside>
      <section className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Vue d'ensemble</p>
            <h1>Bonjour 👋</h1>
            <p>Voici la situation réelle de {organization.name} aujourd'hui.</p>
          </div>
          <Link href="/dashboard/members/new" className="button button-dark">+ Ajouter un membre</Link>
        </header>
        
        <div className="metric-grid">
          {liveMetrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              {metric.trend && <small>{metric.trend}</small>}
              <span className="metric-orbit" />
            </article>
          ))}
        </div>

        <div className="dashboard-grid">
          <article className="panel activity">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Activité</p>
                <h2>Flux d'actions récentes</h2>
              </div>
            </div>
            <RecentActivity activities={finalActivities} />
          </article>

          <article className="panel quick-actions">
            <p className="eyebrow">Raccourcis</p>
            <h2>Que souhaitez-vous faire ?</h2>
            {config.actions.map((action, i) => (
              <Link href={linkFor(action)} key={action}>
                <span>0{i + 1}</span>{action}<b>→</b>
              </Link>
            ))}
          </article>
        </div>

        {/* Financial Trends Chart */}
        <div style={{ marginTop: '24px' }}>
          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Tendances</p>
                <h2>Encaissements (6 derniers mois)</h2>
              </div>
            </div>
            <DashboardCharts data={chartData} currency={organization.currency || 'XOF'} />
          </article>
        </div>
      </section>
    </main>
  );
}
