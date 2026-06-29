"use client";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

const formatMoney = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(n);

const providerNames: Record<string, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  mtn_momo: "MTN MoMo",
  moov_money: "Moov Money",
};

export function MobileMoneyManager({
  organizationId,
  accounts,
  recentPayments,
  canManage,
}: {
  organizationId: string;
  accounts: any[];
  recentPayments: any[];
  canManage: boolean;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("transactions");

  async function handleSubmitAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = Object.fromEntries(new FormData(e.currentTarget));
      const res = await fetch("/api/finance/cash-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_cash_account", organizationId, ...data }),
      });
      if (!res.ok) throw new Error("Erreur lors de la création du compte.");
      setMessage("Numéro de réception ajouté avec succès !");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="finance-workspace">
      
      <div className="finance-stats">
        <article>
          <p>Numéros actifs</p>
          <strong>{accounts.length}</strong>
        </article>
        <article>
          <p>Transactions récentes</p>
          <strong>{recentPayments.length}</strong>
        </article>
        <article>
          <p>Volume entrant (récent)</p>
          <strong>{formatMoney(recentPayments.filter(p => p.status === 'confirmed').reduce((s, p) => s + Number(p.amount), 0))}</strong>
        </article>
      </div>

      <div className="tabs" style={{ display: "flex", gap: "16px", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
        <button onClick={() => setActiveTab("transactions")} style={{ padding: "12px 16px", borderBottom: activeTab === "transactions" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "transactions" ? "bold" : "normal" }}>Transactions</button>
        {canManage && <button onClick={() => setActiveTab("numeros")} style={{ padding: "12px 16px", borderBottom: activeTab === "numeros" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "numeros" ? "bold" : "normal" }}>Numéros & Configuration</button>}
      </div>

      {message && (
        <p className="member-message">{message}</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: canManage && activeTab !== "transactions" ? "2fr 1fr" : "1fr", gap: "24px", alignItems: "start" }}>
        
        {activeTab === "transactions" && (
          <article className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <p className="eyebrow">Historique</p>
                <h2>Transactions récentes (Mobile Money)</h2>
              </div>
              {canManage && (
                <button className="button button-dark" style={{ padding: '6px 12px', fontSize: '14px' }}>
                  + Rapprochement manuel
                </button>
              )}
            </div>
            
            <div className="finance-list" style={{ maxHeight: "600px", overflowY: "auto" }}>
              {recentPayments.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '14px', padding: '16px 0' }}>Aucune transaction récente trouvée.</p>
              ) : (
                recentPayments.map((p) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#111827' }}>
                        {p.member?.first_name} {p.member?.last_name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                          {providerNames[p.provider] || p.provider}
                        </span>
                        <small style={{ color: '#9ca3af' }}>Réf: {p.provider_reference || 'N/A'}</small>
                      </div>
                      <small style={{ color: '#9ca3af' }}>{new Date(p.paid_at).toLocaleString('fr-FR')}</small>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <b style={{ color: '#10b981', fontSize: '16px' }}>+{formatMoney(p.amount)}</b>
                      <span style={{ fontSize: '12px', color: p.status === 'confirmed' ? '#059669' : '#d97706', backgroundColor: p.status === 'confirmed' ? '#d1fae5' : '#fef3c7', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' }}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        )}

        {activeTab === "numeros" && canManage && (
          <>
            <article className="panel">
              <p className="eyebrow">Configuration</p>
              <h2>Numéros actifs</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', maxHeight: "500px", overflowY: "auto" }}>
                {accounts.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>Aucun numéro Mobile Money configuré.</p>
                ) : (
                  accounts.map(acc => (
                    <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div>
                        <b style={{ display: 'block' }}>{acc.name}</b>
                        <small style={{ color: '#6b7280' }}>
                          {providerNames[acc.currency] || acc.currency}
                        </small>
                      </div>
                      <span style={{ padding: '4px 8px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        Actif
                      </span>
                    </div>
                  ))
                )}
              </div>
            </article>

            <div className="finance-forms">
              <form className="panel compact-form" onSubmit={handleSubmitAccount}>
                <p className="eyebrow">Nouveau Canal</p>
                <h2>Ajouter un numéro</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Fournisseur</label>
                    <select name="provider" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                      {Object.entries(providerNames).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Nom / Titulaire</label>
                    <input required name="name" placeholder="Ex: Caisse Principale" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Numéro de téléphone</label>
                    <input required name="phone" placeholder="Ex: +225 07..." style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  </div>

                  <button disabled={busy} className="button button-dark" style={{ marginTop: '8px' }}>
                    {busy ? "Enregistrement..." : "Enregistrer le numéro"}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
