"use client";

import { useState } from "react";

export function MemberWavePaymentButton({ contributionId, amount }: { contributionId: string; amount: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
    }
  }

  return (
    <div style={{ marginTop: "0.75rem" }}>
      <button type="button" onClick={pay} disabled={busy} style={{ border: 0, borderRadius: "0.75rem", padding: "0.75rem 1rem", background: "#1dc9e8", color: "#032d3c", fontWeight: 800, cursor: busy ? "wait" : "pointer", width: "100%" }}>
        {busy ? "Ouverture de Wave…" : `Payer ${Math.round(amount).toLocaleString("fr-FR")} F CFA avec Wave`}
      </button>
      {error && <p role="alert" style={{ color: "#b91c1c", fontSize: "0.78rem", margin: "0.5rem 0 0" }}>{error}</p>}
    </div>
  );
}
