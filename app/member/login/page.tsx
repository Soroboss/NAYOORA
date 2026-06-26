"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MemberLogin() {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function login(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/member-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Numéro introuvable.");
      router.push("/member");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-panel">
        <Link href="/" className="brand" style={{ marginBottom: 40, display: "inline-block" }}>
          <img src="/nayoora-logo.png" alt="" style={{ height: 32 }} />
        </Link>
        <h1>Espace Membre</h1>
        <p>Connectez-vous avec votre numéro de téléphone pour accéder à vos informations.</p>
        
        <form onSubmit={login} className="auth-form" style={{ marginTop: 30 }}>
          <label>
            Numéro de téléphone
            <input 
              type="tel" 
              required 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="Ex: +225 01 02 03 04" 
            />
          </label>
          {error && <p className="member-message" style={{ color: "var(--danger)" }}>{error}</p>}
          <button disabled={busy} className="button button-dark">
            {busy ? "Recherche..." : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
