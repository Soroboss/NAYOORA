"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PortalLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Connexion impossible");
      
      router.push(`/portal/${data.orgSlug}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel" style={{ maxWidth: "400px", margin: "40px auto", padding: "32px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <p className="eyebrow">Espace Membre</p>
        <h1 style={{ fontSize: "24px", margin: "8px 0" }}>Connexion</h1>
        <p style={{ color: "#6b7280", fontSize: "14px" }}>Saisissez votre numéro de téléphone et votre code PIN pour accéder à votre profil.</p>
      </div>

      <form onSubmit={login} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <label style={{ display: "block" }}>
          <span style={{ fontSize: "14px", fontWeight: "500", display: "block", marginBottom: "4px" }}>Numéro de téléphone</span>
          <input 
            type="tel" 
            placeholder="Ex: 0757228731" 
            value={phone} 
            onChange={e => setPhone(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}
          />
        </label>
        
        <label style={{ display: "block" }}>
          <span style={{ fontSize: "14px", fontWeight: "500", display: "block", marginBottom: "4px" }}>Code PIN (4 à 6 chiffres)</span>
          <input 
            type="password" 
            placeholder="Ex: 0000 (PIN par défaut)" 
            value={pin} 
            onChange={e => setPin(e.target.value)}
            required
            pattern="[0-9]{4,6}"
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}
          />
        </label>

        {error && <div style={{ padding: "12px", backgroundColor: "#fef2f2", color: "#ef4444", borderRadius: "6px", fontSize: "14px" }}>{error}</div>}

        <button 
          type="submit" 
          disabled={busy || !phone || !pin}
          className="button button-dark" 
          style={{ width: "100%", marginTop: "8px", padding: "12px", justifyContent: "center" }}
        >
          {busy ? "Vérification..." : "Me connecter"}
        </button>
      </form>
    </div>
  );
}
