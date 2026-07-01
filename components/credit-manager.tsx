"use client";
import { FormEvent, useMemo, useState } from 'react';

const f = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);

async function send(body: object) {
  const r = await fetch('/api/credit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok) throw Error(d.error);
  return d;
}

export function CreditManager({ members, loans, debts, canManage }: { members: any[]; loans: any[]; debts: any[]; canManage: boolean }) {
  const [n, setN] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("vue");

  const active = loans.filter(x => ['disbursed', 'repaying'].includes(x.status));
  const total = useMemo(() => debts.reduce((x, d) => x + Number(d.amount_outstanding), 0), [debts]);

  async function sub(e: FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    setBusy(true);
    try {
      await send({ action, ...Object.fromEntries(new FormData(e.currentTarget)) });
      setN('Opération enregistrée. Actualisez la page pour voir les montants recalculés.');
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
          <p>Prêts actifs</p>
          <strong>{active.length}</strong>
        </article>
        <article>
          <p>Capital prêté</p>
          <strong>{f(active.reduce((s, l) => s + Number(l.principal), 0))}</strong>
        </article>
        <article>
          <p>Créances ouvertes</p>
          <strong>{f(total)}</strong>
        </article>
      </div>

      <div className="tabs" style={{ display: "flex", gap: "16px", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
        <button onClick={() => setActiveTab("vue")} style={{ padding: "12px 16px", borderBottom: activeTab === "vue" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "vue" ? "bold" : "normal" }}>Vue d'ensemble</button>
        <button onClick={() => setActiveTab("prets")} style={{ padding: "12px 16px", borderBottom: activeTab === "prets" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "prets" ? "bold" : "normal" }}>Prêts & Remboursements</button>
        <button onClick={() => setActiveTab("creances")} style={{ padding: "12px 16px", borderBottom: activeTab === "creances" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "creances" ? "bold" : "normal" }}>Créances Libres</button>
      </div>

      {n && <p className="member-message">{n}</p>}

      <div className="module-split" style={{ display: "grid", gridTemplateColumns: canManage && activeTab !== "vue" ? "2fr 1fr" : "1fr", gap: "24px", alignItems: "start" }}>
        
        {activeTab === "vue" && (
          <div className="finance-lists">
            <article className="panel">
              <p className="eyebrow">Prêts</p>
              <h2>Portefeuille</h2>
              <div className="finance-list" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {loans.length === 0 ? <p className="muted">Aucun prêt enregistré.</p> : loans.map(l => (
                  <div key={l.id}>
                    <span>
                      <b>{l.member?.first_name} {l.member?.last_name}</b>
                      <small>{l.duration_months} mois · {l.interest_rate}% · {l.status}</small>
                    </span>
                    <b>{f(l.principal)}</b>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <p className="eyebrow">Créances</p>
              <h2>À recouvrer</h2>
              <div className="finance-list" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {debts.length === 0 ? <p className="muted">Aucune créance.</p> : debts.map(d => (
                  <div key={d.id}>
                    <span>
                      <b>{d.member?.first_name} {d.member?.last_name}</b>
                      <small>Échéance {d.due_date || 'non définie'}</small>
                    </span>
                    <b>{f(d.amount_outstanding)}</b>
                  </div>
                ))}
              </div>
            </article>
          </div>
        )}

        {activeTab === "prets" && (
          <article className="panel">
            <p className="eyebrow">Portefeuille</p>
            <h2>Prêts en cours</h2>
            <div className="finance-list" style={{ maxHeight: "500px", overflowY: "auto" }}>
              {active.length === 0 ? <p className="muted">Aucun prêt actif.</p> : active.map(l => (
                <div key={l.id}>
                  <span>
                    <b>{l.member?.first_name} {l.member?.last_name}</b>
                    <small>{l.duration_months} mois · {l.interest_rate}% · {l.status}</small>
                  </span>
                  <b>{f(l.principal)}</b>
                </div>
              ))}
            </div>
          </article>
        )}

        {activeTab === "creances" && (
          <article className="panel">
            <p className="eyebrow">Détails</p>
            <h2>Créances actives</h2>
            <div className="finance-list" style={{ maxHeight: "500px", overflowY: "auto" }}>
              {debts.filter(d => Number(d.amount_outstanding) > 0).length === 0 ? <p className="muted">Toutes les créances sont soldées.</p> : debts.filter(d => Number(d.amount_outstanding) > 0).map(d => (
                <div key={d.id}>
                  <span>
                    <b>{d.member?.first_name} {d.member?.last_name}</b>
                    <small>Motif: {d.source || 'N/A'}</small>
                  </span>
                  <b>{f(d.amount_outstanding)}</b>
                </div>
              ))}
            </div>
          </article>
        )}

        {canManage && activeTab !== "vue" && (
          <div className="finance-forms">
            
            {activeTab === "prets" && (
              <>
                <form className="panel compact-form" onSubmit={e => sub(e, 'loan')}>
                  <p className="eyebrow">Prêts</p>
                  <h2>Décaisser un prêt</h2>
                  <select name="memberId" required>
                    <option value="">Choisir un membre</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                  </select>
                  <input required name="principal" type="number" min="1" placeholder="Montant FCFA" />
                  <input required name="duration" type="number" min="1" placeholder="Durée (mois)" />
                  <input name="interest" type="number" min="0" placeholder="Taux d’intérêt (%)" />
                  <button disabled={busy} className="button button-dark">Décaisser</button>
                </form>

                <form className="panel compact-form" onSubmit={e => sub(e, 'repayment')}>
                  <p className="eyebrow">Remboursements</p>
                  <h2>Enregistrer un remboursement</h2>
                  <select name="loanId" required>
                    <option value="">Choisir un prêt actif</option>
                    {active.map(l => <option key={l.id} value={l.id}>{l.member?.first_name} {l.member?.last_name} — {f(l.principal)}</option>)}
                  </select>
                  <input required name="principal" type="number" min="1" placeholder="Capital remboursé FCFA" />
                  <input name="interest" type="number" min="0" placeholder="Intérêts reçus FCFA" />
                  <input name="notes" placeholder="Référence ou note" />
                  <button disabled={busy} className="button button-dark">Confirmer</button>
                </form>
              </>
            )}

            {activeTab === "creances" && (
              <form className="panel compact-form" onSubmit={e => sub(e, 'debt')}>
                <p className="eyebrow">Créances</p>
                <h2>Créer une créance</h2>
                <select name="memberId" required>
                  <option value="">Choisir un membre</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                </select>
                <input required name="amount" type="number" min="1" placeholder="Montant FCFA" />
                <input name="dueDate" type="date" />
                <input name="source" placeholder="Motif de la créance" />
                <button disabled={busy} className="button button-dark">Ajouter</button>
              </form>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
