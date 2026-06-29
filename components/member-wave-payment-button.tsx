"use client";

import { useState } from "react";

const paymentPhoneDisplay = "+225 07 57 22 87 31";
const paymentPhone = "+2250757228731";

export function MemberWavePaymentButton({ contributionId, amount }: { contributionId: string; amount: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [provider, setProvider] = useState<"wave" | "orange_money">("wave");
  const [reference, setReference] = useState("");
  const [declared, setDeclared] = useState(false);
  const [copied, setCopied] = useState(false);

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/member/payments/wave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contributionId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error || "Paiement Wave indisponible.");
      window.location.assign(payload.checkoutUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Paiement Wave indisponible.");
      setBusy(false);
      setFallbackOpen(true);
    }
  }

  async function copyPhone() {
    await navigator.clipboard.writeText(paymentPhone);
    setCopied(true);
  }

  async function declarePayment() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/member/payments/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contributionId, provider, reference }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Déclaration impossible.");
      setDeclared(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Déclaration impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: "0.75rem" }}>
      <button type="button" onClick={pay} disabled={busy} style={{ border: 0, borderRadius: "0.75rem", padding: "0.75rem 1rem", background: "#1dc9e8", color: "#032d3c", fontWeight: 800, cursor: busy ? "wait" : "pointer", width: "100%" }}>
        {busy ? "Ouverture de Wave…" : `Payer ${Math.round(amount).toLocaleString("fr-FR")} F CFA avec Wave`}
      </button>
      <button type="button" onClick={() => setFallbackOpen(true)} style={{ width: "100%", marginTop: 7, border: 0, background: "transparent", color: "#475569", fontSize: ".76rem", textDecoration: "underline", cursor: "pointer" }}>Wave ne s’ouvre pas ? Payer manuellement</button>
      {error && !fallbackOpen && <p role="alert" style={{ color: "#b91c1c", fontSize: "0.78rem", margin: "0.5rem 0 0" }}>{error}</p>}

      {fallbackOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="manual-payment-title" onClick={() => setFallbackOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(2,12,27,.72)", backdropFilter: "blur(5px)", display: "grid", placeItems: "center", padding: 16 }}>
          <div onClick={(event) => event.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: "white", borderRadius: 22, padding: 22, boxShadow: "0 25px 70px rgba(0,0,0,.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div><span style={{ color: "#0e9f6e", fontSize: ".72rem", fontWeight: 800, textTransform: "uppercase" }}>Solution de secours</span><h2 id="manual-payment-title" style={{ margin: "5px 0 0", color: "#0b3a6e", fontSize: "1.35rem" }}>Paiement manuel</h2></div>
              <button type="button" aria-label="Fermer" onClick={() => setFallbackOpen(false)} style={{ border: 0, background: "#f1f5f9", width: 34, height: 34, borderRadius: "50%", cursor: "pointer" }}>×</button>
            </div>

            {declared ? (
              <div style={{ marginTop: 18, padding: 18, borderRadius: 14, background: "#dcfce7", color: "#166534" }}><strong>Déclaration enregistrée.</strong><p style={{ margin: "6px 0 0", fontSize: ".85rem" }}>Le trésorier vérifiera la transaction avant de valider la cotisation.</p></div>
            ) : (
              <>
                <p style={{ color: "#475569", lineHeight: 1.55, fontSize: ".9rem" }}>Envoyez exactement <strong>{Math.round(amount).toLocaleString("fr-FR")} F CFA</strong> sur ce numéro avec Wave ou Orange Money :</p>
                <div style={{ padding: 15, borderRadius: 14, background: "#eff6ff", border: "1px solid #bfdbfe", textAlign: "center" }}>
                  <strong style={{ display: "block", color: "#0b3a6e", fontSize: "1.25rem", letterSpacing: ".02em" }}>{paymentPhoneDisplay}</strong>
                  <button type="button" onClick={copyPhone} style={{ marginTop: 8, border: 0, borderRadius: 8, padding: "7px 12px", background: "#0b3a6e", color: "white", fontWeight: 700, cursor: "pointer" }}>{copied ? "Numéro copié ✓" : "Copier le numéro"}</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
                  <button type="button" onClick={() => setProvider("wave")} style={{ padding: 11, borderRadius: 10, border: `2px solid ${provider === "wave" ? "#1dc9e8" : "#e2e8f0"}`, background: provider === "wave" ? "#ecfeff" : "white", fontWeight: 800, cursor: "pointer" }}>Wave</button>
                  <button type="button" onClick={() => setProvider("orange_money")} style={{ padding: 11, borderRadius: 10, border: `2px solid ${provider === "orange_money" ? "#ff7900" : "#e2e8f0"}`, background: provider === "orange_money" ? "#fff7ed" : "white", fontWeight: 800, cursor: "pointer" }}>Orange Money</button>
                </div>
                <label style={{ display: "block", marginTop: 14, color: "#334155", fontSize: ".82rem", fontWeight: 700 }}>Référence reçue après le paiement
                  <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Ex. CI240629123456" style={{ display: "block", width: "100%", marginTop: 6, padding: 12, border: "1px solid #cbd5e1", borderRadius: 10, fontSize: ".95rem" }} />
                </label>
                {error && <p role="alert" style={{ color: "#b91c1c", fontSize: ".78rem" }}>{error}</p>}
                <button type="button" onClick={declarePayment} disabled={busy || reference.trim().length < 4} style={{ width: "100%", marginTop: 14, padding: 13, border: 0, borderRadius: 11, background: "#0e9f6e", color: "white", fontWeight: 800, opacity: busy || reference.trim().length < 4 ? .55 : 1, cursor: "pointer" }}>{busy ? "Enregistrement…" : "J’ai payé — envoyer pour validation"}</button>
                <p style={{ margin: "10px 0 0", color: "#94a3b8", fontSize: ".7rem", textAlign: "center" }}>Ne communiquez jamais votre code secret Wave ou Orange Money.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
