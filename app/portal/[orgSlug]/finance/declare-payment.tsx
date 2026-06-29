"use client";

import { useState } from "react";

export function DeclarePaymentButton({ 
  contributionId, 
  planId, 
  amountDue,
  onDeclared
}: { 
  contributionId: string; 
  planId: string; 
  amountDue: number;
  onDeclared?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [provider, setProvider] = useState("cash");
  const [reference, setReference] = useState("");
  const [proofBase64, setProofBase64] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/finance/declare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributionId,
          planId,
          amount: amountDue,
          provider,
          provider_reference: reference,
          proof_url: proofBase64
        })
      });
      if (res.ok) {
        setIsOpen(false);
        onDeclared?.();
        window.location.reload();
      } else {
        const d = await res.json();
        alert("Erreur: " + d.error);
      }
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{ 
          marginTop: "8px", 
          padding: "6px 12px", 
          background: "#f3f4f6", 
          color: "#374151", 
          border: "1px solid #d1d5db", 
          borderRadius: "6px", 
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: "600",
          marginLeft: "8px"
        }}
      >
        Déclarer
      </button>

      {isOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
          background: "rgba(0,0,0,0.5)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "white", padding: "24px", borderRadius: "12px", width: "90%", maxWidth: "400px" }}>
            <h3 style={{ marginTop: 0 }}>Déclarer un paiement</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>Moyen de paiement</label>
                <select 
                  value={provider} 
                  onChange={e => setProvider(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                >
                  <option value="cash">Espèces</option>
                  <option value="wave">Wave</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="bank_transfer">Virement Bancaire</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>Référence (Optionnel)</label>
                <input 
                  type="text" 
                  value={reference} 
                  onChange={e => setReference(e.target.value)}
                  placeholder="Ex: ID de transaction Wave"
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>Preuve (Capture d'écran)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFile}
                  style={{ fontSize: "14px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  style={{ flex: 1, padding: "10px", background: "#f3f4f6", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  style={{ flex: 1, padding: "10px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                >
                  {submitting ? "Envoi..." : "Soumettre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
