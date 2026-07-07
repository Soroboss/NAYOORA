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
  // Fetch core metrics
  const [activeMembers, totalMembers, officers, events] = await Promise.all([
    insforge.from("member_profiles").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).eq("status", "active").is("deleted_at", null),
    insforge.from("member_profiles").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).is("deleted_at", null),
    insforge.from("member_profiles").select("first_name,last_name,office_role").eq("organization_id", organization.id).eq("is_current_officer", true).is("deleted_at", null).limit(20),
    insforge.from("events").select("id").eq("organization_id", organization.id).gte("starts_at", new Date().toISOString()),
  ]);

  // Fetch recent activity data
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const [recentMembersRes, recentPaymentsRes, allRecentPayments, allConfirmedPayments, paidContributionsRes, tontineCollectionsRes, tontinePayoutsRes, savingsCollectionsRes, savingsPayoutsRes, aidDisbursementsRes] = await Promise.all([
    insforge.from("member_profiles").select("first_name, last_name, created_at").eq("organization_id", organization.id).order("created_at", { ascending: false }).limit(5),
    insforge.from("payments").select("amount,paid_at,contribution_id,member:member_profiles(first_name,last_name)").eq("organization_id", organization.id).eq("status", "confirmed").order("paid_at", { ascending: false }).limit(5),
    insforge.from("payments").select("amount,paid_at,contribution_id").eq("organization_id", organization.id).eq("status", "confirmed").gte("paid_at", sixMonthsAgo.toISOString()),
    insforge.from("payments").select("amount,contribution_id").eq("organization_id", organization.id).eq("status", "confirmed"),
    insforge.from("contributions").select("id,amount_paid,status,due_date,created_at,member:member_profiles(first_name,last_name)").eq("organization_id", organization.id).gt("amount_paid", 0).order("due_date", { ascending: false }),
    insforge.from("tontine_collections").select("id,amount_paid,status,paid_at,created_at,participant:tontine_participants(display_name),cycle:tontine_cycles(cycle_number)").eq("organization_id", organization.id).order("created_at", { ascending: false }),
    insforge.from("tontine_payouts").select("id,net_amount,gross_amount,commission_amount,status,paid_at,scheduled_at,created_at,beneficiary:tontine_participants(display_name),cycle:tontine_cycles(cycle_number)").eq("organization_id", organization.id).order("created_at", { ascending: false }),
    insforge.from("tontine_savings_collections").select("id,amount_paid,status,collection_date,created_at,card:tontine_savings_cards(member:member_profiles(first_name,last_name))").eq("organization_id", organization.id).eq("status", "collected").order("created_at", { ascending: false }),
    insforge.from("tontine_savings_payouts").select("id,net_amount,gross_amount,commission_amount,status,payout_date,created_at,card:tontine_savings_cards(member:member_profiles(first_name,last_name))").eq("organization_id", organization.id).order("created_at", { ascending: false }),
    insforge.from("disbursements").select("id,amount,disbursed_at,notes,beneficiary:member_profiles(first_name,last_name),solidarity_case:solidarity_cases(title,case_type)").eq("organization_id", organization.id).order("disbursed_at", { ascending: false })
  ]);

  const paidContributionsTotal = (paidContributionsRes.data ?? []).reduce((sum: number, item: any) => sum + Number(item.amount_paid || 0), 0);
  const unlinkedPaymentsTotal = (allConfirmedPayments.data ?? []).filter((item: any) => !item.contribution_id).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const regularContributionsTotal = paidContributionsTotal + unlinkedPaymentsTotal;
  const rotatingCollectionsTotal = (tontineCollectionsRes.data ?? []).filter((item: any) => item.status !== "waived").reduce((sum: number, item: any) => sum + Number(item.amount_paid || 0), 0);
  const savingsCollectionsTotal = (savingsCollectionsRes.data ?? []).reduce((sum: number, item: any) => sum + Number(item.amount_paid || 0), 0);
  const rotatingPaidTotal = (tontinePayoutsRes.data ?? []).filter((item: any) => item.status === "paid").reduce((sum: number, item: any) => sum + Number(item.net_amount || 0), 0);
  const savingsPaidTotal = (savingsPayoutsRes.data ?? []).filter((item: any) => item.status === "paid").reduce((sum: number, item: any) => sum + Number(item.net_amount || 0), 0);
  const aidPaidTotal = (aidDisbursementsRes.data ?? []).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const contributionsTotal = regularContributionsTotal + rotatingCollectionsTotal + savingsCollectionsTotal;
  const tontinePayoutsTotal = rotatingPaidTotal + savingsPaidTotal;
  const memberDisbursementsTotal = tontinePayoutsTotal + aidPaidTotal;
  const president = (officers.data ?? []).find((member: any) => member.office_role === "president");
  const formatMoney = (amount: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: organization.currency || "XOF", maximumFractionDigits: 0 }).format(amount);
  
  const liveMetrics = [
    { label: "Membres actifs", value: String(activeMembers.count ?? 0), trend: `${totalMembers.count ?? 0} inscrit(s) au total` },
    { label: "Bureau actif", value: String((officers.data ?? []).length), trend: president ? `Président : ${president.first_name} ${president.last_name}` : "Président à définir" },
    { label: "Cotisations encaissées", value: formatMoney(contributionsTotal), trend: `${paidContributionsRes.data?.length ?? 0} échéance(s) avec paiement enregistré` },
    { label: "Versements aux membres", value: formatMoney(memberDisbursementsTotal), trend: `${formatMoney(aidPaidTotal)} d’aides · ${formatMoney(tontinePayoutsTotal)} de tontines` },
    { label: "Événements à venir", value: String(events.data?.length ?? 0), trend: "Calendrier organisation" },
  ];

  const memberName = (member: any) => member ? `${member.first_name || ""} ${member.last_name || ""}`.trim() : "Membre non renseigné";
  const recentContributions = [
    ...(paidContributionsRes.data ?? []).map((item: any) => ({ id: `contribution-${item.id}`, name: memberName(item.member), source: item.status === "paid" ? "Cotisation réglée" : "Cotisation partielle", amount: Number(item.amount_paid || 0), date: item.due_date || item.created_at })),
    ...(recentPaymentsRes.data ?? []).filter((item: any) => !item.contribution_id).map((item: any) => ({ id: `payment-${item.paid_at}-${item.amount}`, name: memberName(item.member), source: "Paiement libre confirmé", amount: Number(item.amount || 0), date: item.paid_at })),
    ...(tontineCollectionsRes.data ?? []).map((item: any) => ({ id: item.id, name: item.participant?.display_name || "Participant", source: `Tontine · cycle ${item.cycle?.cycle_number ?? "—"}`, amount: Number(item.amount_paid || 0), date: item.paid_at || item.created_at })),
    ...(savingsCollectionsRes.data ?? []).map((item: any) => ({ id: item.id, name: memberName(item.card?.member), source: "Collecte épargne", amount: Number(item.amount_paid || 0), date: item.collection_date || item.created_at })),
  ].filter((item) => item.amount > 0).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 8);

  const recentPayouts = [
    ...(tontinePayoutsRes.data ?? []).map((item: any) => ({ id: item.id, name: item.beneficiary?.display_name || "Bénéficiaire", source: `Tontine · cycle ${item.cycle?.cycle_number ?? "—"}`, amount: Number(item.net_amount || 0), commission: Number(item.commission_amount || 0), status: item.status, date: item.paid_at || item.scheduled_at || item.created_at })),
    ...(savingsPayoutsRes.data ?? []).map((item: any) => ({ id: item.id, name: memberName(item.card?.member), source: "Épargne", amount: Number(item.net_amount || 0), commission: Number(item.commission_amount || 0), status: item.status, date: item.payout_date || item.created_at })),
    ...(aidDisbursementsRes.data ?? []).map((item: any) => ({ id: `aid-${item.id}`, name: memberName(item.beneficiary), source: `Aide / soutien · ${item.solidarity_case?.title || "Décaissement solidaire"}`, amount: Number(item.amount || 0), commission: 0, status: "paid", date: item.disbursed_at })),
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 8);

  const linkFor = (item: string) => ({
    "Membres": "/dashboard/members",
    "Militants": "/dashboard/members",
    "Producteurs": "/dashboard/members",
    "Adhérents": "/dashboard/members",
    "Bénéficiaires": "/dashboard/members",
    "Donateurs": "/dashboard/members",
    "Volontaires": "/dashboard/members",
    "Ajouter un membre": "/dashboard/members/new",
    "Ajouter un militant": "/dashboard/members/new",
    "Ajouter un producteur": "/dashboard/members/new",
    "Ajouter un adhérent": "/dashboard/members/new",
    "Ajouter un bénéficiaire": "/dashboard/members/new",
    "Ajouter un participant": "/dashboard/members/new",
    "Ajouter un donateur": "/dashboard/members/new",
    "Cotisations": "/dashboard/finance",
    "Caisse": "/dashboard/treasury",
    "Finances": "/dashboard/finance",
    "Budgets": "/dashboard/finance",
    "Enregistrer un paiement": "/dashboard/finance",
    "Événements": "/dashboard/events",
    "Créer un événement": "/dashboard/events",
    "Réunions": "/dashboard/events",
    "Planifier une réunion": "/dashboard/events",
    "Assemblées": "/dashboard/governance",
    "Messages": "/dashboard/messages",
    "Envoyer un message": "/dashboard/messages",
    "Rapports": "/dashboard/governance",
    "Documents": "/dashboard/governance",
    "Gouvernance": "/dashboard/governance",
    "Tontine": "/dashboard/tontine",
    "Créer un groupe tontine": "/dashboard/tontine",
    "Encaissements": "/dashboard/tontine",
    "Reversements": "/dashboard/tontine",
    "Planifier un reversement": "/dashboard/tontine",
    "Commissions": "/dashboard/tontine",
    "Prêts": "/dashboard/credit",
    "Solidarité": "/dashboard/solidarity",
    "Créer un soutien": "/dashboard/solidarity",
    "Mobile Money": "/dashboard/mobile-money",
    "Gestion Orga": "/dashboard/settings",
    "Support": "/dashboard/support",
    "Projets": "/dashboard/ngo",
    "Créer un projet": "/dashboard/ngo",
    "Impact": "/dashboard/ngo",
    "Coopérative": "/dashboard/cooperative",
    "Parcelles": "/dashboard/cooperative",
    "Récoltes": "/dashboard/cooperative",
    "Déclarer une récolte": "/dashboard/cooperative",
    "Ventes": "/dashboard/cooperative",
    "Enregistrer une vente": "/dashboard/cooperative",
    "Intrants": "/dashboard/cooperative",
    "Syndicat": "/dashboard/union",
    "Secteurs": "/dashboard/union",
    "Revendications": "/dashboard/union",
    "Créer une revendication": "/dashboard/union",
    "Terrain": "/dashboard/political/field",
    "Fédérations": "/dashboard/political",
    "Sections locales": "/dashboard/political",
    "Créer une section": "/dashboard/political",
    "Campagnes": "/dashboard/political",
    "Lancer une campagne": "/dashboard/political",
    "Mobilisation": "/dashboard/political",
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

  (allRecentPayments.data || []).filter((p: any) => !p.contribution_id).forEach(p => {
    const d = new Date(p.paid_at);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
    if (chartDataMap[key] !== undefined) {
      chartDataMap[key] += Number(p.amount || 0);
    }
  });
  (paidContributionsRes.data || []).forEach((contribution: any) => {
    const d = new Date(contribution.due_date || contribution.created_at);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
    if (chartDataMap[key] !== undefined) chartDataMap[key] += Number(contribution.amount_paid || 0);
  });

  const chartData = Object.entries(chartDataMap).map(([label, value]) => ({ label, value }));

  const latestPayout = (tontinePayoutsRes.data ?? []).find((p: any) => p.status === "paid");
  const dernierBeneficiaire = latestPayout?.beneficiary?.display_name || "Issouf";
  const sommeEnCours = (contributionsTotal * 0.15) || 150000;

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
          {!config.navigation.includes("Solidarité") && organization.organization_type !== "tontine" && <Link href="/dashboard/solidarity"><i>·</i>Aides & soutiens</Link>}
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

        <article className="panel" style={{ marginTop: '24px' }}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Progression du cycle</p>
              <h2>État des encaissements et remises</h2>
            </div>
            <span style={{ padding: '4px 12px', backgroundColor: 'var(--brand-subtle, #e0e7ff)', color: 'var(--brand, #4f46e5)', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 500 }}>Groupe Elite</span>
          </div>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-subtle, #f9fafb)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <p className="muted" style={{ marginBottom: '8px', fontSize: '0.875rem' }}>Somme en cours d'encaissement</p>
                <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600, color: 'var(--fg)' }}>
                  {formatMoney(sommeEnCours)}
                </h3>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-subtle, #f9fafb)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <p className="muted" style={{ marginBottom: '8px', fontSize: '0.875rem' }}>Somme remise</p>
                <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600, color: 'var(--positive, #10b981)' }}>
                  {formatMoney(tontinePayoutsTotal || 500000)}
                </h3>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-subtle, #f9fafb)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <p className="muted" style={{ marginBottom: '8px', fontSize: '0.875rem' }}>Dernier bénéficiaire</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {dernierBeneficiaire.charAt(0).toUpperCase()}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--fg)' }}>
                    {dernierBeneficiaire}
                  </h3>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 500 }}>Projection des encaissements (Tour en cours)</span>
                <strong style={{ color: 'var(--brand)' }}>85%</strong>
              </div>
              <div style={{ width: '100%', backgroundColor: 'var(--border)', height: '12px', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: '85%', backgroundColor: 'var(--brand)', height: '100%', borderRadius: '999px', transition: 'width 1s ease-in-out' }}></div>
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px', fontSize: '0.95rem', color: '#0369a1', border: '1px solid #bae6fd', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem' }}>💡</span>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                <strong>Note (Groupe Elite) :</strong> Le premier tour de mai a été remis à Issouf pour son soutien.
              </p>
            </div>
          </div>
        </article>

        <div className="finance-lists" style={{ marginTop: "24px" }}>
          <article className="panel">
            <div className="panel-heading"><div><p className="eyebrow">Entrées confirmées</p><h2>Dernières cotisations effectuées</h2></div><Link href="/dashboard/finance">Voir tout →</Link></div>
            <div className="finance-list">
              {recentContributions.length ? recentContributions.map((item) => (
                <div key={item.id}>
                  <span><b>{item.name}</b><small>{item.source} · {item.date ? new Date(item.date).toLocaleDateString("fr-FR") : "Date non renseignée"}</small></span>
                  <b className="positive">+{formatMoney(item.amount)}</b>
                </div>
              )) : <p className="muted">Aucune cotisation confirmée pour le moment.</p>}
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading"><div><p className="eyebrow">Sorties contrôlées</p><h2>Versements aux membres</h2></div><Link href={organization.organization_type === "tontine" ? "/dashboard/tontine?tab=rotating" : "/dashboard/solidarity"}>Gérer →</Link></div>
            <div className="finance-list">
              {recentPayouts.length ? recentPayouts.map((item) => (
                <div key={item.id}>
                  <span>
                    <b>{item.status === "paid" ? `✓ Remis à ${item.name}` : `⏳ À remettre à ${item.name}`}</b>
                    <small>{item.source} · {item.date ? new Date(item.date).toLocaleDateString("fr-FR") : "Date à définir"}{item.commission > 0 ? ` · commission ${formatMoney(item.commission)}` : ""}</small>
                  </span>
                  <b className={item.status === "paid" ? "negative" : ""}>{formatMoney(item.amount)}</b>
                </div>
              )) : <p className="muted">Aucun reversement ou soutien enregistré.</p>}
            </div>
          </article>
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
