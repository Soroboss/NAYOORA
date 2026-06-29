"use client";
import { FormEvent, useMemo, useState } from "react";

const money = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);

async function send(body: object) {
  const r = await fetch('/api/finance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error);
  return d;
}

function exportCSV(filename: string, rows: any[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(row => headers.map(header => {
      let cell = row[header] === null || row[header] === undefined ? '' : row[header];
      cell = cell.toString().replace(/"/g, '""');
      if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
      return cell;
    }).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export function FinanceManager({ plans, members, contributions, payments, cash, canManage }: { plans: any[]; members: any[]; contributions: any[]; payments: any[]; cash: any[]; canManage: boolean }) {
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const balance = useMemo(() => cash.reduce((s, x) => s + (x.direction === 'in' ? Number(x.amount) : -Number(x.amount)), 0), [cash]);
  const overdueContributions = useMemo(() => contributions.filter(c => new Date(c.due_date) < new Date() && Number(c.amount_paid) < Number(c.amount_due)), [contributions]);
  
  const memberHistory = useMemo(() => {
    if (!selectedMember) return null;
    const memberObj = members.find(m => m.id === selectedMember);
    const memberContribs = contributions.filter(c => c.member?.id === selectedMember || c.member_profile_id === selectedMember);
    const memberPayments = payments.filter(p => p.member?.id === selectedMember || p.member_profile_id === selectedMember);
    return { member: memberObj, contributions: memberContribs, payments: memberPayments };
  }, [selectedMember, members, contributions, payments]);

  async function submit(e: FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    setBusy(true);
    setNotice('');
    try {
      const f = new FormData(e.currentTarget);
      const d = Object.fromEntries(f);
      await send({ action, ...d });
      setNotice('Opération enregistrée. Actualisez la page pour voir les données à jour.');
      e.currentTarget.reset();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Erreur.')
    } finally {
      setBusy(false)
    }
  }

  function handleExportContributions() {
    const data = contributions.map(c => ({
      'Membre': `${c.member?.first_name} ${c.member?.last_name}`,
      'Plan': c.plan?.name,
      'Échéance': c.due_date,
      'Montant Dû': c.amount_due,
      'Montant Payé': c.amount_paid,
      'Statut': c.status
    }));
    exportCSV('cotisations.csv', data);
  }

  const [activeTab, setActiveTab] = useState("vue");

  return (
    <div className="finance-workspace">
      <div className="finance-stats">
        <article>
          <p>Caisse disponible</p>
          <strong>{money(balance)}</strong>
        </article>
        <article>
          <p>Cotisations à encaisser</p>
          <strong>{money(contributions.reduce((s, x) => s + Number(x.amount_due) - Number(x.amount_paid), 0))}</strong>
        </article>
        <article>
          <p>Paiements récents</p>
          <strong>{payments.length}</strong>
        </article>
      </div>

      <div className="tabs" style={{ display: "flex", gap: "16px", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
        <button onClick={() => setActiveTab("vue")} style={{ padding: "12px 16px", borderBottom: activeTab === "vue" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "vue" ? "bold" : "normal" }}>Vue d'ensemble</button>
        <button onClick={() => setActiveTab("cotisations")} style={{ padding: "12px 16px", borderBottom: activeTab === "cotisations" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "cotisations" ? "bold" : "normal" }}>Plans & Échéances</button>
        <button onClick={() => setActiveTab("encaissement")} style={{ padding: "12px 16px", borderBottom: activeTab === "encaissement" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "encaissement" ? "bold" : "normal" }}>Encaisser un paiement</button>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: canManage && activeTab !== "vue" ? "2fr 1fr" : "1fr", gap: "24px" }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {activeTab === "vue" && (
            <>
              {overdueContributions.length > 0 && (
                <article className="panel" style={{ borderColor: 'var(--error, #e53935)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <p className="eyebrow" style={{ color: 'var(--error, #e53935)' }}>Relances</p>
                      <h2>{overdueContributions.length} Retard(s) de paiement</h2>
                    </div>
                  </div>
                  <div className="finance-list">
                    {overdueContributions.map(c => (
                      <div key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedMember(c.member?.id || c.member_profile_id)}>
                        <span>
                          <b>{c.member?.first_name} {c.member?.last_name}</b>
                          <small style={{ color: 'var(--error, #e53935)' }}>Échu le {new Date(c.due_date).toLocaleDateString('fr-FR')} ({c.plan?.name})</small>
                        </span>
                        <b style={{ color: 'var(--error, #e53935)' }}>Reste {money(c.amount_due - c.amount_paid)}</b>
                      </div>
                    ))}
                  </div>
                </article>
              )}

              <div className="finance-lists">
                <article className="panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <p className="eyebrow">Cotisations</p>
                      <h2>Échéances récentes</h2>
                    </div>
                    <button onClick={handleExportContributions} className="button button-small">Export CSV</button>
                  </div>
                  {contributions.length ?
                    <div className="finance-list" style={{ maxHeight: "400px", overflowY: "auto" }}>
                      {contributions.map(c => (
                        <div key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedMember(c.member?.id || c.member_profile_id)}>
                          <span>
                            <b>{c.member?.first_name} {c.member?.last_name}</b>
                            <small>{c.plan?.name} · échéance {c.due_date}</small>
                          </span>
                          <b>{money(c.amount_paid)} / {money(c.amount_due)}</b>
                        </div>
                      ))}
                    </div>
                    : <p className="muted">Aucune échéance pour le moment.</p>
                  }
                </article>

                <article className="panel">
                  <p className="eyebrow">Caisse</p>
                  <h2>Derniers mouvements</h2>
                  {cash.length ?
                    <div className="finance-list" style={{ maxHeight: "400px", overflowY: "auto" }}>
                      {cash.map(x => (
                        <div key={x.id}>
                          <span>
                            <b>{x.category}</b>
                            <small>{new Date(x.occurred_at).toLocaleDateString('fr-FR')}</small>
                          </span>
                          <b className={x.direction === 'in' ? 'positive' : 'negative'}>{x.direction === 'in' ? '+' : '−'}{money(x.amount)}</b>
                        </div>
                      ))}
                    </div>
                    : <p className="muted">Aucun mouvement enregistré.</p>
                  }
                </article>
              </div>
            </>
          )}

          {activeTab === "cotisations" && (
            <article className="panel">
              <p className="eyebrow">Gestion</p>
              <h2>Plans de Cotisations</h2>
              <div className="finance-list">
                {plans.length === 0 ? <p className="muted">Aucun plan défini.</p> : plans.map(p => (
                  <div key={p.id}>
                    <span>
                      <b>{p.name}</b>
                      <small>Fréquence : {p.frequency}</small>
                    </span>
                    <b>{money(p.amount)}</b>
                  </div>
                ))}
              </div>
            </article>
          )}

          {activeTab === "encaissement" && (
            <article className="panel">
              <p className="eyebrow">Tableau de bord</p>
              <h2>Paiements récents</h2>
              <div className="finance-list" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {payments.length === 0 ? <p className="muted">Aucun paiement récent.</p> : payments.map(p => (
                  <div key={p.id}>
                    <span>
                      <b>{(p.member as any)?.first_name} {(p.member as any)?.last_name}</b>
                      <small>{new Date(p.paid_at).toLocaleString('fr-FR')} — {p.provider || "Espèces"}</small>
                    </span>
                    <b className="positive">+{money(p.amount)}</b>
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>
      
        {canManage && activeTab !== "vue" && (
          <div className="finance-forms" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {activeTab === "cotisations" && (
              <>
                <form className="panel compact-form" onSubmit={e => submit(e, 'plan')}>
                  <p className="eyebrow">Ajout</p>
                  <h2>Créer un plan</h2>
                  <input name="name" required placeholder="Ex. Cotisation mensuelle" />
                  <input name="amount" required type="number" min="0" placeholder="Montant FCFA" />
                  <select name="frequency">
                    <option value="monthly">Mensuelle</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="quarterly">Trimestrielle</option>
                    <option value="yearly">Annuelle</option>
                  </select>
                  <button disabled={busy} className="button button-dark">Créer</button>
                </form>

                <form className="panel compact-form" onSubmit={e => submit(e, (e.nativeEvent as any).submitter?.value || 'contribution')}>
                  <p className="eyebrow">Assignation</p>
                  <h2>Attribuer une échéance</h2>
                  <select name="memberId">
                    <option value="">Pour un seul membre (ou ignorer)</option>
                    {members.map(m => <option value={m.id} key={m.id}>{m.first_name} {m.last_name}</option>)}
                  </select>
                  <select name="excludeMemberId">
                    <option value="">Exclure un membre (optionnel)</option>
                    {members.map(m => <option value={m.id} key={m.id}>Sauf : {m.first_name} {m.last_name}</option>)}
                  </select>
                  <select name="planId" required>
                    <option value="">Choisir un plan</option>
                    {plans.map(p => <option value={p.id} key={p.id}>{p.name} — {money(p.amount)}</option>)}
                  </select>
                  <input required name="dueDate" type="date" />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button type="submit" name="action" value="contribution" disabled={busy} className="button button-dark" style={{ flex: 1 }}>Individuel</button>
                    <button type="submit" name="action" value="mass_contribution" disabled={busy} className="button" style={{ flex: 1 }} title="Générer pour tous les membres actifs">Pour Tous</button>
                  </div>
                </form>
              </>
            )}

            {activeTab === "encaissement" && (
              <form className="panel compact-form" onSubmit={e => submit(e, 'payment')}>
                <p className="eyebrow">Paiements</p>
                <h2>Encaisser</h2>
                <select name="contributionId" required>
                  <option value="">Choisir une échéance</option>
                  {contributions.filter(c => c.status !== 'paid').map(c => <option value={c.id} key={c.id}>{c.member?.first_name} {c.member?.last_name} — reste {money(c.amount_due - c.amount_paid)}</option>)}
                </select>
                <input required name="amount" type="number" min="1" placeholder="Montant reçu FCFA" />
                <input name="provider" placeholder="Espèces, Wave, Orange…" />
                <button disabled={busy} className="button button-dark">Confirmer le paiement</button>
              </form>
            )}
          </div>
        )}
      </div>

      {notice && <p className="member-message">{notice}</p>}



      {selectedMember && memberHistory && (
        <div className="modal-backdrop" onClick={() => setSelectedMember(null)}>
          <div className="modal-content panel" onClick={e => e.stopPropagation()}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div>
                <p className="eyebrow">Relevé de compte</p>
                <h2>{memberHistory.member?.first_name} {memberHistory.member?.last_name}</h2>
              </div>
              <button onClick={() => setSelectedMember(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </header>
            
            <div style={{ display: 'grid', gap: '2rem' }}>
              <section>
                <h3>Échéances ({memberHistory.contributions.length})</h3>
                {memberHistory.contributions.length === 0 ? <p className="muted">Aucune cotisation.</p> : (
                  <div className="finance-list" style={{ marginTop: '1rem' }}>
                    {memberHistory.contributions.map((c: any) => (
                      <div key={c.id}>
                        <span>
                          <b>{c.plan?.name}</b>
                          <small>Échéance: {c.due_date} | Statut: {c.status}</small>
                        </span>
                        <b style={{ color: c.amount_paid < c.amount_due ? 'var(--error, #e53935)' : 'inherit' }}>{money(c.amount_paid)} / {money(c.amount_due)}</b>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h3>Historique des Paiements ({memberHistory.payments.length})</h3>
                {memberHistory.payments.length === 0 ? <p className="muted">Aucun paiement.</p> : (
                  <div className="finance-list" style={{ marginTop: '1rem' }}>
                    {memberHistory.payments.map((p: any) => (
                      <div key={p.id}>
                        <span>
                          <b>Paiement reçu</b>
                          <small>{new Date(p.paid_at).toLocaleString('fr-FR')}</small>
                        </span>
                        <b className="positive">+{money(p.amount)}</b>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
