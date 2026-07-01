"use client";
import { FormEvent, useState } from 'react';

async function send(x: object) {
  const r = await fetch('/api/treasury', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(x) });
  const d = await r.json();
  if (!r.ok) throw Error(d.error);
  return d;
}

export function TreasuryManager({ accounts, categories, reconciliations, transactions, canManage }: { accounts: any[]; categories: any[]; reconciliations: any[]; transactions: any[]; canManage: boolean }) {
  const [n, setN] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("vue");

  async function sub(e: FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    setBusy(true);
    try {
      await send({ action, ...Object.fromEntries(new FormData(e.currentTarget)) });
      setN('Opération enregistrée. Actualisez la page pour voir les données à jour.');
      ((e.target || e.currentTarget) as HTMLFormElement | null)?.reset();
    } catch (e) {
      setN(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  const balance = transactions.reduce((x, t) => x + (t.direction === 'in' ? Number(t.amount) : -Number(t.amount)), 0);

  return (
    <div className="finance-workspace">
      <div className="finance-stats">
        <article>
          <p>Comptes actifs</p>
          <strong>{accounts.length}</strong>
        </article>
        <article>
          <p>Solde global</p>
          <strong>{balance.toLocaleString('fr-FR')} FCFA</strong>
        </article>
        <article>
          <p>Rapprochements</p>
          <strong>{reconciliations.length}</strong>
        </article>
      </div>

      <div className="tabs" style={{ display: "flex", gap: "16px", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
        <button onClick={() => setActiveTab("vue")} style={{ padding: "12px 16px", borderBottom: activeTab === "vue" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "vue" ? "bold" : "normal" }}>Vue d'ensemble</button>
        <button onClick={() => setActiveTab("operations")} style={{ padding: "12px 16px", borderBottom: activeTab === "operations" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "operations" ? "bold" : "normal" }}>Saisir une opération</button>
        <button onClick={() => setActiveTab("gestion")} style={{ padding: "12px 16px", borderBottom: activeTab === "gestion" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "gestion" ? "bold" : "normal" }}>Comptes & Gestion</button>
      </div>

      {n && <p className="member-message">{n}</p>}

      <div className="module-split" style={{ display: "grid", gridTemplateColumns: canManage && activeTab !== "vue" ? "1fr 1fr" : "1fr", gap: "24px", alignItems: "start" }}>
        
        {activeTab === "vue" && (
          <div className="finance-lists">
            <article className="panel">
              <p className="eyebrow">Historique</p>
              <h2>Flux récents</h2>
              <div className="finance-list" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {transactions.length === 0 ? <p className="muted">Aucune transaction.</p> : transactions.map(t => (
                  <div key={t.id}>
                    <span>
                      <b>{t.category || 'Virement/Autre'}</b>
                      <small>{new Date(t.created_at).toLocaleString('fr-FR')} — {t.account?.name}</small>
                    </span>
                    <b className={t.direction === 'in' ? 'positive' : 'negative'}>{t.direction === 'in' ? '+' : '-'}{Number(t.amount).toLocaleString('fr-FR')} FCFA</b>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <p className="eyebrow">Contrôle</p>
              <h2>Derniers Rapprochements</h2>
              <div className="finance-list">
                {reconciliations.length === 0 ? <p className="muted">Aucun rapprochement.</p> : reconciliations.map(r => (
                  <div key={r.id}>
                    <span>
                      <b>{r.account?.name}</b>
                      <small>{new Date(r.reconciled_at).toLocaleString('fr-FR')}</small>
                    </span>
                    <b style={{ color: r.discrepancy !== 0 ? 'var(--error, #e53935)' : 'inherit' }}>Écart: {Number(r.discrepancy).toLocaleString('fr-FR')} FCFA</b>
                  </div>
                ))}
              </div>
            </article>
          </div>
        )}

        {canManage && activeTab === "operations" && (
          <>
            <form className="panel compact-form" onSubmit={e => sub(e, 'expense')}>
              <p className="eyebrow">Dépenses</p>
              <h2>Enregistrer une dépense / recette</h2>
              <select required name="accountId">
                <option value="">Compte</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input required name="category" placeholder="Catégorie (ex: Transport)" />
              <input required name="amount" type="number" min="1" placeholder="Montant FCFA" />
              <button disabled={busy} className="button button-dark">Enregistrer</button>
            </form>

            <form className="panel compact-form" onSubmit={e => sub(e, 'transfer')}>
              <p className="eyebrow">Virements</p>
              <h2>Virement interne</h2>
              <select required name="from">
                <option value="">Depuis (Compte source)</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <select required name="to">
                <option value="">Vers (Compte cible)</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input required name="amount" type="number" min="1" placeholder="Montant FCFA" />
              <button disabled={busy} className="button button-dark">Virer</button>
            </form>
          </>
        )}

        {canManage && activeTab === "gestion" && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <form className="panel compact-form" onSubmit={e => sub(e, 'account')}>
                <p className="eyebrow">1 · Comptes</p>
                <h2>Ajouter un compte</h2>
                <input required name="name" placeholder="Ex. Caisse principale" />
                <select name="type">
                  <option value="cash">Espèces</option>
                  <option value="bank">Banque</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
                <button disabled={busy} className="button button-dark">Créer</button>
              </form>

              <form className="panel compact-form" onSubmit={e => sub(e, 'category')}>
                <p className="eyebrow">2 · Catégories</p>
                <h2>Classer les flux</h2>
                <input required name="name" placeholder="Ex. Transport" />
                <select name="direction">
                  <option value="out">Dépense</option>
                  <option value="in">Recette</option>
                </select>
                <button disabled={busy} className="button button-dark">Créer</button>
              </form>
            </div>

            <form className="panel compact-form" onSubmit={e => sub(e, 'reconciliation')}>
              <p className="eyebrow">5 · Rapprochements</p>
              <h2>Clôturer un compte</h2>
              <select required name="accountId">
                <option value="">Compte</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input required name="book" type="number" placeholder="Solde comptable estimé" />
              <input required name="actual" type="number" placeholder="Solde réel compté" />
              <button disabled={busy} className="button button-dark">Rapprocher</button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
