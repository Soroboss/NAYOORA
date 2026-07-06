"use client";
import { useMemo, useState } from 'react';
import { WhatsAppButton } from './whatsapp-button';

const f = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);

function getCollectionMessage(c: any, orgName: string) {
  const name = c.member?.first_name || 'Membre';
  const org = orgName || 'notre organisation';
  if (c.status === 'paid') {
    return `Cher(e) ${name}, merci du fond du cœur pour ta générosité et ton paiement de ${f(c.amount_paid)}. C'est grâce à des membres dévoués comme toi que ${org} brille et avance !`;
  }
  return `Cher(e) ${name}, frère/sœur de notre union, nous t'écrivons avec amour pour te rappeler ton échéance de ${f(c.amount_due)} prévue pour le ${new Date(c.due_date).toLocaleDateString('fr-FR')}. Ta contribution est précieuse pour ${org}.`;
}

export function CollectionsManager({ contributions, imports, errors, canManage, orgName = "notre organisation" }: { contributions: any[]; imports: any[]; errors: any[]; canManage: boolean; orgName?: string }) {
  const [n, setN] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("vue");

  const rows = useMemo(() => filter === 'all' ? contributions : contributions.filter(c => c.status === filter), [contributions, filter]);
  const overdue = contributions.filter(c => c.status === 'overdue');
  const outstanding = overdue.reduce((x, c) => x + Number(c.amount_due) - Number(c.amount_paid), 0);

  async function refresh() {
    setBusy(true);
    const r = await fetch('/api/collections', { method: 'POST' });
    const d = await r.json();
    setBusy(false);
    setN(r.ok ? `${d.updated} échéance(s) marquée(s) en retard. Actualisez la page.` : d.error);
  }

  function template() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['Prénom;Nom;Téléphone;Email;Matricule\nAwa;Koné;+2250700000000;awa@example.com;M-001\n'], { type: 'text/csv;charset=utf-8' }));
    a.download = 'modele-membres-NAYOORA.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="finance-workspace">
      <div className="finance-stats">
        <article>
          <p>Échéances suivies</p>
          <strong>{contributions.length}</strong>
        </article>
        <article>
          <p>Retards</p>
          <strong>{overdue.length}</strong>
        </article>
        <article>
          <p>À recouvrer</p>
          <strong>{f(outstanding)}</strong>
        </article>
      </div>

      <div className="tabs" style={{ display: "flex", gap: "16px", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
        <button onClick={() => setActiveTab("vue")} style={{ padding: "12px 16px", borderBottom: activeTab === "vue" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "vue" ? "bold" : "normal" }}>Vue d'ensemble</button>
        <button onClick={() => setActiveTab("echeances")} style={{ padding: "12px 16px", borderBottom: activeTab === "echeances" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "echeances" ? "bold" : "normal" }}>États de Paiement</button>
        <button onClick={() => setActiveTab("imports")} style={{ padding: "12px 16px", borderBottom: activeTab === "imports" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "imports" ? "bold" : "normal" }}>Import & Données</button>
      </div>

      {n && <p className="member-message">{n}</p>}

      <div className="module-split" style={{ display: "grid", gridTemplateColumns: canManage && activeTab !== "vue" ? "2fr 1fr" : "1fr", gap: "24px", alignItems: "start" }}>
        
        {activeTab === "vue" && (
          <div className="finance-lists">
            <article className="panel">
              <div className="directory-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p className="eyebrow">Récents</p>
                  <h2>Retards</h2>
                </div>
              </div>
              <div className="finance-list" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {overdue.length === 0 ? <p className="muted">Aucun retard détecté.</p> : overdue.map(c => (
                  <div key={c.id}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <b>{c.member?.first_name} {c.member?.last_name}</b>
                      {c.member?.phone && <WhatsAppButton phone={c.member.phone} message={getCollectionMessage(c, orgName)} />}
                    </span>
                    <span>
                      <small>{c.plan?.name} · échéance {c.due_date}</small>
                    </span>
                    <b className="negative">{f(c.amount_paid)} / {f(c.amount_due)}</b>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <p className="eyebrow">Imports</p>
              <h2>Derniers fichiers</h2>
              <div className="finance-list" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {imports.length === 0 ? <p className="muted">Aucun import.</p> : imports.map(i => (
                  <div key={i.id}>
                    <span>
                      <b>{i.file_name}</b>
                      <small>{i.imported_rows}/{i.total_rows} importés · {i.failed_rows} erreur(s)</small>
                    </span>
                    <b>{i.status}</b>
                  </div>
                ))}
              </div>
            </article>
          </div>
        )}

        {activeTab === "echeances" && (
          <article className="panel">
            <div className="directory-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p className="eyebrow">États de paiement</p>
                <h2>Échéances</h2>
              </div>
              <select value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="all">Tous les états</option>
                <option value="due">À payer</option>
                <option value="partially_paid">Partiel</option>
                <option value="paid">Payé</option>
                <option value="overdue">En retard</option>
              </select>
            </div>
            <div className="finance-list" style={{ maxHeight: "500px", overflowY: "auto" }}>
              {rows.length === 0 ? <p className="muted">Aucune échéance ne correspond à ce filtre.</p> : rows.map(c => (
                <div key={c.id}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <b>{c.member?.first_name} {c.member?.last_name}</b>
                    {c.member?.phone && <WhatsAppButton phone={c.member.phone} message={getCollectionMessage(c, orgName)} />}
                  </span>
                  <span>
                    <small>{c.plan?.name} · échéance {c.due_date} · {c.status}</small>
                  </span>
                  <b className={c.status === "overdue" ? "negative" : ""}>{f(c.amount_paid)} / {f(c.amount_due)}</b>
                </div>
              ))}
            </div>
          </article>
        )}

        {activeTab === "imports" && (
          <article className="panel">
            <p className="eyebrow">Corrections</p>
            <h2>Lignes à revoir</h2>
            <div className="finance-list" style={{ maxHeight: "500px", overflowY: "auto" }}>
              {errors.length === 0 ? <p className="muted">Aucune erreur d'importation.</p> : errors.map(e => (
                <div key={e.id}>
                  <span>
                    <b>Ligne {e.row_number} · {(e.import as any)?.file_name}</b>
                    <small>{e.message}</small>
                  </span>
                </div>
              ))}
            </div>
          </article>
        )}

        {canManage && activeTab !== "vue" && (
          <div className="finance-forms">
            {activeTab === "echeances" && (
              <article className="panel channel-note">
                <p className="eyebrow">Retards</p>
                <h2>Actualiser les impayés</h2>
                <p>Transforme les échéances passées non soldées en retards, sans modifier les paiements validés.</p>
                <button disabled={busy} className="button button-dark" onClick={refresh}>{busy ? 'Analyse…' : 'Analyser les retards'}</button>
              </article>
            )}

            {activeTab === "imports" && (
              <article className="panel channel-note">
                <p className="eyebrow">Import CSV avancé</p>
                <h2>Qualité des données</h2>
                <p>Téléchargez le modèle, importez depuis Membres et consultez les lignes rejetées ci-dessous.</p>
                <button className="button button-dark" onClick={template}>Télécharger le modèle CSV</button>
              </article>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
