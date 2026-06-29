"use client";
import { FormEvent, useState } from "react";

export function RemindersManager({ debts, organizationId }: { debts: any[]; organizationId: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [channel, setChannel] = useState("sms");
  const [body, setBody] = useState("Bonjour [Nom], sauf erreur de notre part, vous avez des cotisations en retard d'un montant total de [Montant]. Merci de régulariser rapidement.");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);

  const toggleAll = () => {
    if (selected.length === debts.length) setSelected([]);
    else setSelected(debts.map(d => d.memberId));
  };

  const toggleOne = (id: string) => {
    if (selected.includes(id)) setSelected(selected.filter(x => x !== id));
    else setSelected([...selected, id]);
  };

  async function send(e: FormEvent) {
    e.preventDefault();
    if (selected.length === 0) return setMessage("Veuillez sélectionner au moins un membre.");
    setBusy(true);
    setMessage("");
    try {
      // Create message draft and simulate sending
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          channel,
          body,
          recipients: selected,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(`✅ ${selected.length} message(s) préparé(s) avec succès !`);
      setSelected([]);
    } catch (err: any) {
      setMessage(`❌ Erreur: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="finance-workspace">
      <article className="panel">
        <p className="eyebrow">Sélection des destinataires</p>
        <h2>Membres avec arriérés</h2>
        
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}>
            <input 
              type="checkbox" 
              checked={selected.length === debts.length && debts.length > 0} 
              onChange={toggleAll}
            />
            Tout sélectionner ({debts.length} membres)
          </label>
        </div>

        <div className="finance-list" style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
          {debts.length === 0 ? (
            <p style={{ padding: "16px", color: "#6b7280" }}>Aucun membre en retard.</p>
          ) : (
            debts.map(d => (
              <label key={d.memberId} style={{ display: "flex", justifyContent: "space-between", padding: "12px", borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input 
                    type="checkbox" 
                    checked={selected.includes(d.memberId)}
                    onChange={() => toggleOne(d.memberId)}
                  />
                  <div>
                    <b style={{ display: "block" }}>{d.firstName} {d.lastName}</b>
                    <small style={{ color: "#6b7280" }}>{d.phone || "Pas de numéro"}</small>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <b style={{ color: "#ef4444" }}>{formatMoney(d.totalDebt)}</b>
                  <small style={{ display: "block", color: "#6b7280" }}>{d.debtCount} cotisation(s)</small>
                </div>
              </label>
            ))
          )}
        </div>
      </article>

      <form className="panel compact-form" onSubmit={send}>
        <p className="eyebrow">Composition</p>
        <h2>Rédiger le message de relance</h2>

        <label style={{ display: "block", marginTop: "16px" }}>
          <span style={{ fontSize: "14px", fontWeight: "500" }}>Canal de diffusion</span>
          <select 
            value={channel} 
            onChange={e => setChannel(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", marginTop: "4px" }}
          >
            <option value="sms">SMS</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp (Automatisé)</option>
          </select>
        </label>

        <label style={{ display: "block", marginTop: "16px" }}>
          <span style={{ fontSize: "14px", fontWeight: "500" }}>Contenu du message</span>
          <textarea 
            required 
            rows={5}
            value={body}
            onChange={e => setBody(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", marginTop: "4px", resize: "vertical" }}
          />
          <small style={{ color: "#6b7280", display: "block", marginTop: "4px" }}>
            Variables magiques : <code>[Nom]</code>, <code>[Montant]</code>
          </small>
        </label>

        <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
          <button disabled={busy || selected.length === 0} className="button button-dark">
            {busy ? "Envoi en cours..." : `Envoyer à ${selected.length} membre(s)`}
          </button>
          {message && <span style={{ color: message.startsWith("✅") ? "#059669" : "#ef4444", fontSize: "14px" }}>{message}</span>}
        </div>
      </form>
    </div>
  );
}
