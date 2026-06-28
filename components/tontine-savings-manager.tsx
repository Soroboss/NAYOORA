"use client";

import { FormEvent, useMemo, useState } from "react";

type Row = Record<string, any>;
const money = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);

async function send(payload: object) {
  const response = await fetch("/api/tontine/savings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Opération impossible.");
  return data;
}

export function TontineSavingsManager({ 
  products, 
  cards, 
  collections, 
  payouts, 
  members,
  canManage 
}: { 
  products: Row[]; 
  cards: Row[]; 
  collections: Row[]; 
  payouts: Row[]; 
  members: Row[];
  canManage: boolean 
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  
  async function submit(event: FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault(); 
    setError(""); 
    setLoading(action);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try { 
      await send({ action, ...data }); 
      location.reload(); 
    } catch (e) { 
      setError(e instanceof Error ? e.message : "Erreur inconnue."); 
      setLoading(""); 
    }
  }

  // Calculate global metrics
  const totalCollected = collections.reduce((sum, c) => sum + Number(c.amount_paid), 0);
  const totalPaidOut = payouts.reduce((sum, p) => sum + Number(p.net_amount), 0);
  const totalCommission = payouts.reduce((sum, p) => sum + Number(p.commission_amount), 0);
  
  return (
    <div className="dashboard-grid">
      <article className="panel activity">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Produits</p>
            <h2>Plans d'épargne</h2>
          </div>
        </div>
        {products.length > 0 ? products.map((p) => (
          <div className="list-row" key={p.id}>
            <b>{p.name}</b>
            <span>{money(Number(p.contribution_amount))} / jour · {p.duration_days} jours</span>
            <small>Commission: {money(Number(p.commission_amount))}</small>
          </div>
        )) : (
          <div className="empty-state">
            <div>📈</div>
            <h3>Aucun produit</h3>
            <p>Créez un modèle de collecte (ex: 1000F / jour sur 31 jours).</p>
          </div>
        )}
        {canManage && (
          <form className="inline-form" onSubmit={(event) => submit(event, "product")}>
            <input name="name" placeholder="Nom (ex: Épargne 1000F)" required />
            <input name="contributionAmount" type="number" min="0" placeholder="Cotisation" required />
            <input name="durationDays" type="number" min="1" placeholder="Durée (jours)" defaultValue="31" required />
            <input name="commissionAmount" type="number" min="0" placeholder="Commission" defaultValue="1000" />
            <button disabled={loading === "product"}>Créer</button>
          </form>
        )}
      </article>

      <article className="panel quick-actions">
        <p className="eyebrow">Cartes</p>
        <h2>Souscriptions actives</h2>
        {cards.length > 0 ? cards.slice(0, 8).map((c) => {
          // Calculate progress
          const cardCollections = collections.filter(col => col.card_id === c.id);
          const collectedAmount = cardCollections.reduce((sum, col) => sum + Number(col.amount_paid), 0);
          const progress = c.expected_amount > 0 ? Math.min(100, Math.round((collectedAmount / c.expected_amount) * 100)) : 0;
          
          return (
            <button key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>{c.member?.first_name} {c.member?.last_name}</span>
                <b>{money(collectedAmount)} / {money(c.expected_amount)}</b>
              </div>
              <div style={{ width: '100%', height: '4px', backgroundColor: '#e5e7eb', marginTop: '8px', borderRadius: '2px' }}>
                <div style={{ width: `${progress}%`, height: '100%', backgroundColor: progress >= 100 ? '#10b981' : '#3b82f6', borderRadius: '2px' }}></div>
              </div>
            </button>
          );
        }) : (
          <p style={{ fontSize: '14px', color: '#6b7280' }}>Aucune carte active.</p>
        )}
        
        {canManage && products.length > 0 && (
          <form className="inline-form" onSubmit={(event) => submit(event, "card")}>
            <select name="productId" required>
              <option value="">Sélectionner un produit...</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select name="memberId" required>
              <option value="">Sélectionner un membre...</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
            </select>
            <select name="collectorId">
              <option value="">Assigner un collecteur (optionnel)...</option>
              {members.map((m) => <option key={m.id} value={m.user_id}>{m.first_name} {m.last_name}</option>)}
            </select>
            <button disabled={loading === "card"}>Ouvrir carte</button>
          </form>
        )}
      </article>

      <article className="panel activity">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Encaissements</p>
            <h2>Pointage journalier</h2>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Total encaissé</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{money(totalCollected)}</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Reversements nets</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{money(totalPaidOut)}</div>
          </div>
        </div>

        {canManage && cards.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3>Nouveau pointage</h3>
            <form className="inline-form" onSubmit={(event) => submit(event, "collection")}>
              <select name="cardId" required>
                <option value="">Sélectionner une carte...</option>
                {cards.filter(c => c.status === 'active').map((c) => (
                  <option key={c.id} value={c.id}>{c.member?.first_name} {c.member?.last_name} ({money(c.product?.contribution_amount)})</option>
                ))}
              </select>
              <input name="amountPaid" type="number" min="0" placeholder="Montant encaissé" required />
              <button disabled={loading === "collection"}>Pointer</button>
            </form>
          </div>
        )}

        {canManage && cards.length > 0 && (
          <div>
            <h3>Reversement fin de cycle</h3>
            <form className="inline-form" onSubmit={(event) => submit(event, "payout")}>
              <select name="cardId" required>
                <option value="">Sélectionner une carte pleine...</option>
                {cards.filter(c => c.status === 'active' || c.status === 'completed').map((c) => (
                  <option key={c.id} value={c.id}>{c.member?.first_name} {c.member?.last_name} - Attendu: {money(c.expected_amount)}</option>
                ))}
              </select>
              <input name="grossAmount" type="number" min="0" placeholder="Montant brut" required />
              <input name="commissionAmount" type="number" min="0" placeholder="Commission collecteur" defaultValue="0" />
              <button disabled={loading === "payout"}>Payer</button>
            </form>
          </div>
        )}

        {error && <p className="form-error">{error}</p>}
      </article>
    </div>
  );
}
