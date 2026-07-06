"use client";
import { FormEvent, useMemo, useState } from 'react';
import { WhatsAppButton } from './whatsapp-button';

const f = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);

function getSolidarityCaseMessage(c: any, orgName: string) {
  const name = c.member?.first_name || 'Membre';
  const org = orgName || 'notre organisation';
  if (c.status === 'approved') {
    return `Cher(e) ${name}, face à l'épreuve ou l'événement, ${org} se tient à tes côtés. Ton dossier d'aide a été approuvé. Nous sommes ensemble, unis et forts !`;
  } else if (c.status === 'open') {
    return `Cher(e) ${name}, nous avons bien reçu l'ouverture de ton dossier de solidarité. Toute l'union de ${org} est en pensée avec toi.`;
  }
  return `Cher(e) ${name}, le statut de ton dossier d'aide a été mis à jour. N'oublie jamais que tu n'es pas seul(e), nous sommes une famille.`;
}

function getSolidarityDisbursementMessage(d: any, orgName: string) {
  const name = d.beneficiary?.first_name || 'Bénéficiaire';
  const org = orgName || 'notre organisation';
  return `Cher(e) ${name}, ${org} t'entoure de tout son amour. Un versement de solidarité de ${f(Number(d.amount))} t'a été remis. N'oublie jamais que tu n'es pas seul(e), nous formons une grande famille !`;
}

async function send(x: object) {
  const r = await fetch('/api/solidarity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(x) });
  const d = await r.json();
  if (!r.ok) throw Error(d.error);
  return d;
}

export function SolidarityManager({ members, cases, disbursements, canManage, orgName = "notre organisation" }: { members: any[]; cases: any[]; disbursements: any[]; canManage: boolean; orgName?: string }) {
  const [n, setN] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("vue");

  const total = useMemo(() => disbursements.reduce((s, d) => s + Number(d.amount), 0), [disbursements]);

  async function sub(e: FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    setBusy(true);
    try {
      await send({ action, ...Object.fromEntries(new FormData(e.currentTarget)) });
      setN('Opération enregistrée. Actualisez la page pour voir le dossier mis à jour.');
      ((e.target || e.currentTarget) as HTMLFormElement | null)?.reset();
    } catch (e) {
      setN(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="finance-workspace">
      <div className="finance-stats">
        <article>
          <p>Dossiers ouverts</p>
          <strong>{cases.filter(c => ['open', 'approved'].includes(c.status)).length}</strong>
        </article>
        <article>
          <p>Aide approuvée</p>
          <strong>{f(cases.reduce((s, c) => s + Number(c.approved_amount || 0), 0))}</strong>
        </article>
        <article>
          <p>Décaissements</p>
          <strong>{f(total)}</strong>
        </article>
      </div>

      <div className="tabs" style={{ display: "flex", gap: "16px", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
        <button onClick={() => setActiveTab("vue")} style={{ padding: "12px 16px", borderBottom: activeTab === "vue" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "vue" ? "bold" : "normal" }}>Vue d'ensemble</button>
        <button onClick={() => setActiveTab("dossiers")} style={{ padding: "12px 16px", borderBottom: activeTab === "dossiers" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "dossiers" ? "bold" : "normal" }}>Gestion des Dossiers</button>
        <button onClick={() => setActiveTab("fonds")} style={{ padding: "12px 16px", borderBottom: activeTab === "fonds" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "fonds" ? "bold" : "normal" }}>Contributions & Versements</button>
      </div>

      {n && <p className="member-message">{n}</p>}

      <div className="module-split" style={{ display: "grid", gridTemplateColumns: canManage && activeTab !== "vue" ? "2fr 1fr" : "1fr", gap: "24px", alignItems: "start" }}>
        
        {activeTab === "vue" && (
          <div className="finance-lists">
            <article className="panel">
              <p className="eyebrow">Dossiers</p>
              <h2>Soutiens en cours</h2>
              <div className="finance-list" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {cases.length === 0 ? <p className="muted">Aucun dossier.</p> : cases.map(c => (
                  <div key={c.id}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <b>{c.title}</b>
                      {c.member?.phone && <WhatsAppButton phone={c.member.phone} message={getSolidarityCaseMessage(c, orgName)} />}
                    </span>
                    <span>
                      <small>{c.member?.first_name} {c.member?.last_name} · {c.case_type} · {c.status}</small>
                    </span>
                    <b>{f(c.approved_amount || c.requested_amount || 0)}</b>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <p className="eyebrow">Historique</p>
              <h2>Décaissements</h2>
              <div className="finance-list" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {disbursements.length === 0 ? <p className="muted">Aucun décaissement.</p> : disbursements.map(d => (
                  <div key={d.id}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <b>✓ Remis à {d.beneficiary?.first_name} {d.beneficiary?.last_name}</b>
                      {d.beneficiary?.phone && <WhatsAppButton phone={d.beneficiary.phone} message={getSolidarityDisbursementMessage(d, orgName)} />}
                    </span>
                    <span>
                      <small>{d.solidarity_case?.title} · {new Date(d.disbursed_at).toLocaleDateString('fr-FR')}</small>
                    </span>
                    <b className="negative">−{f(d.amount)}</b>
                  </div>
                ))}
              </div>
            </article>
          </div>
        )}

        {activeTab === "dossiers" && (
          <article className="panel">
            <p className="eyebrow">Registre</p>
            <h2>Tous les dossiers</h2>
            <div className="finance-list" style={{ maxHeight: "500px", overflowY: "auto" }}>
              {cases.length === 0 ? <p className="muted">Aucun dossier enregistré.</p> : cases.map(c => (
                <div key={c.id}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <b>{c.title}</b>
                    {c.member?.phone && <WhatsAppButton phone={c.member.phone} message={getSolidarityCaseMessage(c, orgName)} />}
                  </span>
                  <span>
                    <small>{c.member?.first_name} {c.member?.last_name} · {c.case_type} · {c.status}</small>
                  </span>
                  <b>{f(c.approved_amount || c.requested_amount || 0)}</b>
                </div>
              ))}
            </div>
          </article>
        )}

        {activeTab === "fonds" && (
          <article className="panel">
            <p className="eyebrow">Mouvements</p>
            <h2>Aides versées</h2>
            <div className="finance-list" style={{ maxHeight: "500px", overflowY: "auto" }}>
              {disbursements.length === 0 ? <p className="muted">Aucun versement.</p> : disbursements.map(d => (
                <div key={d.id}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <b>✓ Aide remise à {d.beneficiary?.first_name} {d.beneficiary?.last_name}</b>
                    {d.beneficiary?.phone && <WhatsAppButton phone={d.beneficiary.phone} message={getSolidarityDisbursementMessage(d, orgName)} />}
                  </span>
                  <span>
                    <small>{d.solidarity_case?.title} · {new Date(d.disbursed_at).toLocaleDateString('fr-FR')}</small>
                  </span>
                  <b className="negative">−{f(d.amount)}</b>
                </div>
              ))}
            </div>
          </article>
        )}

        {canManage && activeTab !== "vue" && (
          <div className="finance-forms">
            
            {activeTab === "dossiers" && (
              <form className="panel compact-form" onSubmit={e => sub(e, 'case')}>
                <p className="eyebrow">Soutiens</p>
                <h2>Créer un dossier</h2>
                <select name="memberId" required>
                  <option value="">Choisir un membre</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                </select>
                <select name="type">
                  <option value="illness">Maladie</option>
                  <option value="death">Décès</option>
                  <option value="marriage">Mariage</option>
                  <option value="birth">Naissance</option>
                  <option value="emergency">Urgence</option>
                  <option value="other">Autre</option>
                </select>
                <input required name="title" placeholder="Objet de la demande" />
                <input name="amount" type="number" min="0" placeholder="Montant demandé FCFA" />
                <button disabled={busy} className="button button-dark">Ouvrir le dossier</button>
              </form>
            )}

            {activeTab === "fonds" && (
              <>
                <form className="panel compact-form" onSubmit={e => sub(e, 'contribution')}>
                  <p className="eyebrow">Fonds</p>
                  <h2>Ajouter une contribution</h2>
                  <select name="caseId" required>
                    <option value="">Choisir un dossier</option>
                    {cases.filter(c => c.status !== 'disbursed').map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  <select name="memberId">
                    <option value="">Contribution de l’organisation</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                  </select>
                  <input required name="amount" type="number" min="1" placeholder="Montant FCFA" />
                  <button disabled={busy} className="button button-dark">Ajouter</button>
                </form>

                <form className="panel compact-form" onSubmit={e => sub(e, 'disbursement')}>
                  <p className="eyebrow">Décaissement</p>
                  <h2>Verser une aide</h2>
                  <select name="caseId" required>
                    <option value="">Choisir un dossier</option>
                    {cases.filter(c => ['open', 'approved'].includes(c.status)).map(c => <option key={c.id} value={c.id}>{c.title} — {c.member?.first_name}</option>)}
                  </select>
                  <input required name="amount" type="number" min="1" placeholder="Montant versé FCFA" />
                  <input name="notes" placeholder="Note ou référence" />
                  <button disabled={busy} className="button button-dark">Décaisser</button>
                </form>
              </>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
