"use client";

import { useState } from "react";
import { toast } from "sonner";

export function PinModifierModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    try {
      const res = await fetch("/api/member-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la modification");
      }

      toast.success("Code PIN modifié avec succès !");
      setIsOpen(false);
      setCurrentPin("");
      setNewPin("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          background: "#f1f5f9",
          border: "1px solid #e2e8f0",
          color: "#0b3a6e",
          padding: "8px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}
      >
        <span>🔒</span> Modifier mon code PIN
      </button>

      {isOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "white", padding: "24px", borderRadius: "12px", width: "90%", maxWidth: "400px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "1.25rem", color: "#0b2447" }}>Modifier mon mot de passe (PIN)</h2>
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "20px" }}>Si vous n'en avez pas encore, utilisez "0000" comme code actuel.</p>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.9rem", fontWeight: 600, color: "#334155" }}>Code PIN actuel</label>
                <input 
                  type="password" 
                  inputMode="numeric"
                  maxLength={4}
                  required
                  value={currentPin}
                  onChange={e => setCurrentPin(e.target.value)}
                  placeholder="Ex: 0000"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.9rem", fontWeight: 600, color: "#334155" }}>Nouveau code PIN (4 chiffres)</label>
                <input 
                  type="password" 
                  inputMode="numeric"
                  maxLength={4}
                  required
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  placeholder="Nouveau code"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  style={{ flex: 1, padding: "10px", background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer", fontWeight: 600, color: "#475569" }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={busy || newPin.length !== 4}
                  style={{ flex: 1, padding: "10px", background: "#0b2447", border: "none", color: "white", borderRadius: "8px", cursor: busy || newPin.length !== 4 ? "not-allowed" : "pointer", fontWeight: 600, opacity: busy || newPin.length !== 4 ? 0.7 : 1 }}
                >
                  {busy ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
