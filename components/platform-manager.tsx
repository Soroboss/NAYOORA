"use client";

import { FormEvent, useMemo, useState } from "react";

type PlatformManagerProps = {
  plans: any[];
  organizations: any[];
  subscriptions: any[];
  invoices: any[];
  requests: any[];
  notes: any[];
  activity: any[];
  settings: any[];
  members: any[];
  memberProfiles: any[];
  logs: any[];
  users: any[];
};

const tabs = [
  ["overview", "Tableau de bord"],
  ["tenants", "Tenants"],
  ["billing", "Abonnements"],
  ["users", "Utilisateurs"],
  ["requests", "Requêtes"],
  ["activity", "Activité"],
  ["settings", "Paramètres"],
] as const;

const money = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n || 0);
const date = (value?: string) => value ? new Date(value).toLocaleDateString("fr-FR") : "—";
const short = (value?: string) => value ? `${value.slice(0, 8)}…` : "—";

async function send(payload: object) {
  const response = await fetch("/api/platform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Opération impossible.");
  return data;
}

export function PlatformManager(props: PlatformManagerProps) {
  const { plans, organizations, subscriptions, invoices, requests, notes, activity, settings, members, memberProfiles, logs } = props;
  const users = props.users ?? [];
  const [tab, setTab] = useState<(typeof tabs)[number][0]>("overview");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => {
    const activeSubscriptions = subscriptions.filter((item) => item.status === "active").length;
    const openInvoices = invoices.filter((item) => item.status === "open");
    const monthlyRecurring = subscriptions.reduce((sum, item) => sum + Number(item.plan?.price_xof ?? 0), 0);
    const openAmount = openInvoices.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
    const openRequests = requests.filter((item) => !["resolved", "closed"].includes(item.status)).length;
    const urgentRequests = requests.filter((item) => item.priority === "urgent" && !["resolved", "closed"].includes(item.status)).length;
    const activeMemberProfiles = memberProfiles.filter((item) => item.status === "active").length;
    return { activeSubscriptions, openInvoices: openInvoices.length, monthlyRecurring, openAmount, openRequests, urgentRequests, activeMemberProfiles };
  }, [subscriptions, invoices, requests, memberProfiles]);

  const enrichedOrganizations = useMemo(() => organizations.map((organization) => {
    const subscription = subscriptions.find((item) => item.organization_id === organization.id);
    const tenantInvoices = invoices.filter((item) => item.organization_id === organization.id);
    const tenantRequests = requests.filter((item) => item.organization_id === organization.id);
    const tenantMembers = members.filter((item) => item.organization_id === organization.id);
    const tenantMemberProfiles = memberProfiles.filter((item) => item.organization_id === organization.id);
    const latestNote = notes.find((item) => item.organization_id === organization.id);
    return { ...organization, subscription, tenantInvoices, tenantRequests, tenantMembers, tenantMemberProfiles, latestNote };
  }), [organizations, subscriptions, invoices, requests, members, memberProfiles, notes]);

  async function submit(event: FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      await send({ action, ...Object.fromEntries(new FormData(event.currentTarget)) });
      setNotice("Opération enregistrée. Les données seront visibles après actualisation.");
      event.currentTarget.reset();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setBusy(false);
    }
  }

  async function quick(payload: object) {
    setBusy(true);
    setNotice("");
    try {
      await send(payload);
      setNotice("Mise à jour enregistrée. Actualisez si nécessaire.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="platform-console">
      <nav className="platform-tabs" aria-label="Modules plateforme">
        {tabs.map(([value, label]) => <button key={value} onClick={() => setTab(value)} className={tab === value ? "active" : ""}>{label}</button>)}
      </nav>

      {notice && <p className="member-message">{notice}</p>}

      {tab === "overview" && <section className="platform-grid">
        <div className="platform-kpis">
          <article><span>Tenants</span><strong>{organizations.length}</strong><small>{members.length} comptes d’accès</small></article>
          <article><span>Membres inscrits</span><strong>{stats.activeMemberProfiles}</strong><small>{memberProfiles.length} fiches membres au total</small></article>
          <article><span>MRR estimé</span><strong>{money(stats.monthlyRecurring)}</strong><small>{stats.activeSubscriptions} abonnements actifs</small></article>
          <article><span>Factures ouvertes</span><strong>{money(stats.openAmount)}</strong><small>{stats.openInvoices} factures à suivre</small></article>
        </div>
        <article className="panel platform-wide">
          <p className="eyebrow">Santé SaaS</p>
          <h2>Signal de pilotage</h2>
          <div className="health-grid">
            <div><b>{subscriptions.filter((item) => item.status === "trialing").length}</b><span>Essais en cours</span></div>
            <div><b>{subscriptions.filter((item) => item.status === "past_due").length}</b><span>Abonnements impayés</span></div>
            <div><b>{requests.filter((item) => item.status === "waiting_tenant").length}</b><span>En attente tenant</span></div>
            <div><b>{logs.length}</b><span>Logs récents tenants</span></div>
          </div>
        </article>
        <article className="panel">
          <p className="eyebrow">Activité récente</p>
          <h2>Journal plateforme</h2>
          <div className="platform-list">
            {activity.slice(0, 8).map((item) => <div key={item.id}><span><b>{item.title}</b><small>{item.event_type} · {date(item.created_at)}</small></span><i className={`pill ${item.severity}`}>{item.severity}</i></div>)}
          </div>
        </article>
        <article className="panel">
          <p className="eyebrow">À traiter</p>
          <h2>Requêtes prioritaires</h2>
          <div className="platform-list">
            {requests.slice(0, 8).map((item) => <div key={item.id}><span><b>{item.title}</b><small>{item.organization?.name ?? "Plateforme"} · {item.status}</small></span><i className={`pill ${item.priority}`}>{item.priority}</i></div>)}
          </div>
        </article>
      </section>}

      {tab === "users" && <section className="platform-grid">
        <article className="panel platform-wide">
          <p className="eyebrow">Comptes inscrits</p>
          <h2>Tous les utilisateurs connus de la plateforme</h2>
          <div className="tenant-table users-table">
            {users.map((item) => {
              const linkedMemberships = members.filter((member) => member.user_id === item.id);
              return <div key={item.id}>
                <span><b>{item.full_name || item.email || short(item.id)}</b><small>{item.email || "Email non disponible"} · {short(item.id)}</small></span>
                <span><b>{linkedMemberships.length}</b><small>organisation(s)</small></span>
                <span><b>{date(item.created_at)}</b><small>inscription</small></span>
                <span><b>{date(item.synced_at)}</b><small>sync</small></span>
                <button disabled={busy} onClick={() => quick({ action: "activity", eventType: "user_review", severity: "info", title: `Revue utilisateur: ${item.email || item.id}` })}>Tracer revue</button>
              </div>;
            })}
          </div>
        </article>
        <article className="panel">
          <p className="eyebrow">Pourquoi un compte peut manquer ?</p>
          <h2>Synchronisation</h2>
          <p className="muted">Les comptes d’authentification sont synchronisés dans une table miroir protégée par RLS pour éviter d’exposer directement `auth.users` à l’application.</p>
        </article>
      </section>}

      {tab === "tenants" && <section className="platform-grid">
        <article className="panel platform-wide">
          <p className="eyebrow">Tenants</p>
          <h2>Organisations clientes</h2>
          <div className="tenant-table tenant-table-six">
            {enrichedOrganizations.map((organization) => <div key={organization.id}>
              <span><b>{organization.name}</b><small>{organization.organization_type} · {organization.country_code ?? "CI"} · {short(organization.id)}</small></span>
              <span><b>{organization.subscription?.plan?.name ?? "Sans offre"}</b><small>{organization.subscription?.status ?? "à configurer"}</small></span>
              <span><b>{organization.tenantMemberProfiles.filter((item: any) => item.status === "active").length}</b><small>membres actifs</small></span>
              <span><b>{organization.tenantMembers.length}</b><small>comptes accès</small></span>
              <span><b>{organization.tenantRequests.length}</b><small>requêtes</small></span>
              <button disabled={busy} onClick={() => quick({ action: "activity", organizationId: organization.id, eventType: "tenant_review", severity: "info", title: `Revue tenant: ${organization.name}` })}>Tracer revue</button>
            </div>)}
          </div>
        </article>
        <form className="panel compact-form" onSubmit={(event) => submit(event, "note")}>
          <p className="eyebrow">Suivi tenant</p>
          <h2>Ajouter une note interne</h2>
          <select required name="organizationId"><option value="">Organisation</option>{organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <select name="noteType"><option value="follow_up">Suivi</option><option value="risk">Risque</option><option value="success">Succès</option><option value="billing">Facturation</option><option value="security">Sécurité</option></select>
          <input required name="title" placeholder="Titre de la note" />
          <textarea name="body" placeholder="Contexte, observation, décision…" />
          <input name="nextAction" placeholder="Prochaine action" />
          <input name="nextActionAt" type="datetime-local" />
          <button disabled={busy} className="button button-dark">Enregistrer</button>
        </form>
        <article className="panel">
          <p className="eyebrow">Notes récentes</p>
          <h2>Relation client</h2>
          <div className="platform-list">{notes.slice(0, 10).map((item) => <div key={item.id}><span><b>{item.title}</b><small>{item.organization?.name} · {item.note_type}</small></span><small>{date(item.created_at)}</small></div>)}</div>
        </article>
      </section>}

      {tab === "billing" && <section className="platform-grid">
        <form className="panel compact-form" onSubmit={(event) => submit(event, "plan")}>
          <p className="eyebrow">Plans SaaS</p>
          <h2>Créer une offre</h2>
          <input required name="code" placeholder="standard" />
          <input required name="name" placeholder="Nom de l’offre" />
          <input required name="price" type="number" min="0" placeholder="Prix mensuel XOF" />
          <input name="limit" type="number" min="1" placeholder="Limite membres" />
          <input name="adminLimit" type="number" min="1" placeholder="Limite administrateurs" />
          <input name="features" placeholder="Fonctions séparées par virgules" />
          <button disabled={busy} className="button button-dark">Créer</button>
        </form>
        <form className="panel compact-form" onSubmit={(event) => submit(event, "subscription")}>
          <p className="eyebrow">Abonnements</p>
          <h2>Attribuer une offre</h2>
          <select required name="organizationId"><option value="">Organisation</option>{organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <select required name="planId"><option value="">Plan</option>{plans.map((item) => <option key={item.id} value={item.id}>{item.name} · {money(Number(item.price_xof))}</option>)}</select>
          <select name="status"><option value="trialing">Essai</option><option value="active">Actif</option><option value="past_due">Impayé</option><option value="cancelled">Annulé</option></select>
          <input name="endsAt" type="date" />
          <button disabled={busy} className="button button-dark">Enregistrer</button>
        </form>
        <form className="panel compact-form" onSubmit={(event) => submit(event, "invoice")}>
          <p className="eyebrow">Facturation</p>
          <h2>Créer une facture</h2>
          <select required name="organizationId"><option value="">Organisation</option>{organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <input required name="amount" type="number" min="0" placeholder="Montant XOF" />
          <select name="status"><option value="open">Ouverte</option><option value="draft">Brouillon</option><option value="paid">Payée</option><option value="void">Annulée</option></select>
          <input name="dueAt" type="date" />
          <button disabled={busy} className="button button-dark">Créer</button>
        </form>
        <article className="panel platform-wide">
          <p className="eyebrow">Suivi revenus</p>
          <h2>Plans, abonnements et factures</h2>
          <div className="settings-grid plan-editor">
            {plans.map((plan) => <form key={plan.id} onSubmit={(event) => submit(event, "planUpdate")}>
              <input type="hidden" name="planId" value={plan.id} />
              <b>{plan.name}</b>
              <input name="name" defaultValue={plan.name} />
              <input name="price" type="number" min="0" defaultValue={Number(plan.price_xof ?? 0)} />
              <input name="limit" type="number" min="1" defaultValue={plan.member_limit ?? ""} placeholder="Membres" />
              <input name="adminLimit" type="number" min="1" defaultValue={plan.admin_limit ?? ""} placeholder="Admins" />
              <label className="check-line"><input name="active" type="checkbox" value="true" defaultChecked={plan.active !== false} /> Active landing</label>
              <button className="button button-dark" disabled={busy}>Modifier</button>
            </form>)}
          </div>
          <div className="tenant-table billing-table">
            {subscriptions.map((item) => <div key={item.id}><span><b>{item.organization?.name}</b><small>{item.status} · depuis {date(item.starts_at)}</small></span><span><b>{item.plan?.name ?? "Sans plan"}</b><small>{money(Number(item.plan?.price_xof ?? 0))}/mois</small></span><span><b>{item.plan?.member_limit ?? "∞"}</b><small>membres max</small></span><button disabled={busy} onClick={() => quick({ action: "subscription", organizationId: item.organization_id, planId: item.plan_id, status: item.status === "active" ? "past_due" : "active" })}>{item.status === "active" ? "Marquer impayé" : "Activer"}</button></div>)}
          </div>
        </article>
      </section>}

      {tab === "requests" && <section className="platform-grid">
        <form className="panel compact-form" onSubmit={(event) => submit(event, "request")}>
          <p className="eyebrow">Support & opérations</p>
          <h2>Créer une requête</h2>
          <select name="organizationId"><option value="">Plateforme globale</option>{organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <select name="requestType"><option value="support">Support</option><option value="billing">Facturation</option><option value="upgrade">Migration offre</option><option value="technical">Technique</option><option value="security">Sécurité</option><option value="data">Données</option><option value="incident">Incident</option></select>
          <select name="priority"><option value="normal">Normal</option><option value="high">Élevé</option><option value="urgent">Urgent</option><option value="low">Faible</option></select>
          <input required name="title" placeholder="Objet de la requête" />
          <textarea name="description" placeholder="Description, contexte, impact…" />
          <input name="dueAt" type="datetime-local" />
          <button disabled={busy} className="button button-dark">Créer la requête</button>
        </form>
        <article className="panel platform-wide">
          <p className="eyebrow">Pipeline</p>
          <h2>Requêtes tenant & plateforme</h2>
          <div className="request-board">
            {["open", "in_progress", "waiting_tenant", "resolved"].map((status) => <div key={status}><h3>{status.replace("_", " ")}</h3>{requests.filter((item) => item.status === status).map((item) => <article key={item.id}><b>{item.title}</b><small>{item.organization?.name ?? "Plateforme"} · {item.request_type}</small>{item.description && <small>{item.description}</small>}{item.resolution && <small>Réponse : {item.resolution}</small>}<i className={`pill ${item.priority}`}>{item.priority}</i><form onSubmit={(event) => submit(event, "requestStatus")}><input type="hidden" name="requestId" value={item.id} /><input type="hidden" name="status" value={status === "resolved" ? "closed" : "resolved"} /><textarea name="resolution" placeholder="Réponse au tenant…" /><button disabled={busy}>{status === "resolved" ? "Clore" : "Répondre & résoudre"}</button></form></article>)}</div>)}
          </div>
        </article>
      </section>}

      {tab === "activity" && <section className="platform-grid">
        <form className="panel compact-form" onSubmit={(event) => submit(event, "activity")}>
          <p className="eyebrow">Journal SaaS</p>
          <h2>Tracer un événement</h2>
          <select name="organizationId"><option value="">Plateforme globale</option>{organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <input required name="eventType" placeholder="incident, déploiement, revue…" />
          <select name="severity"><option value="info">Info</option><option value="success">Succès</option><option value="warning">Alerte</option><option value="critical">Critique</option></select>
          <input required name="title" placeholder="Titre événement" />
          <button disabled={busy} className="button button-dark">Ajouter</button>
        </form>
        <article className="panel platform-wide">
          <p className="eyebrow">Timeline</p>
          <h2>Activité plateforme</h2>
          <div className="timeline">{activity.map((item) => <div key={item.id}><span /><b>{item.title}</b><small>{item.organization?.name ?? "NAYOORA"} · {item.event_type} · {date(item.created_at)}</small><i className={`pill ${item.severity}`}>{item.severity}</i></div>)}</div>
        </article>
        <article className="panel platform-wide">
          <p className="eyebrow">Logs tenants</p>
          <h2>Dernières actions métier</h2>
          <div className="platform-list">{logs.map((item) => <div key={item.id}><span><b>{item.action} · {item.entity_type}</b><small>{item.organization?.name ?? short(item.organization_id)} · {date(item.created_at)}</small></span><small>{short(item.entity_id)}</small></div>)}</div>
        </article>
      </section>}

      {tab === "settings" && <section className="platform-grid">
        <form className="panel compact-form" onSubmit={(event) => submit(event, "setting")}>
          <p className="eyebrow">Paramètres globaux</p>
          <h2>Modifier une clé</h2>
          <input required name="key" placeholder="tenant_health" />
          <textarea required name="value" placeholder='{"inactive_tenant_days":30}' />
          <input name="description" placeholder="Description" />
          <button disabled={busy} className="button button-dark">Enregistrer</button>
        </form>
        <article className="panel platform-wide">
          <p className="eyebrow">Configuration</p>
          <h2>Paramètres SaaS actifs</h2>
          <div className="settings-grid">{settings.map((item) => <article key={item.key}><b>{item.key}</b><small>{item.description}</small><pre>{JSON.stringify(item.value, null, 2)}</pre></article>)}</div>
        </article>
        <article className="panel">
          <p className="eyebrow">Sécurité</p>
          <h2>Contrôles console</h2>
          <ul className="security-checks">
            <li>Console non exposée dans les pages publiques</li>
            <li>Route `/platform` protégée par session</li>
            <li>Accès base limité à `platform_admins`</li>
            <li>Tables opérations avec RLS actif</li>
          </ul>
        </article>
      </section>}
    </div>
  );
}
