"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Profile = {
  memberId: string;
  organizationId: string;
  organizationName: string;
  organizationType: string;
};

export default function MemberLogin() {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const router = useRouter();

  async function login(e?: FormEvent, selectedMemberId?: string) {
    if (e) e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload: any = { phone };
      if (selectedMemberId) payload.memberId = selectedMemberId;

      const response = await fetch("/api/member-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Erreur lors de la connexion.");

      if (data.multiple) {
        setProfiles(data.profiles);
      } else {
        router.push("/member");
      }
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
        
        {!profiles ? (
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
        ) : (
          <div style={{ marginTop: 30 }}>
            <p className="eyebrow" style={{ marginBottom: 10 }}>Sélectionnez un espace</p>
            <p style={{ marginBottom: 20 }}>Nous avons trouvé plusieurs profils liés à votre numéro. À quel espace souhaitez-vous accéder ?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {profiles.map((p) => (
                <button 
                  key={p.memberId} 
                  className="button" 
                  onClick={() => login(undefined, p.memberId)}
                  disabled={busy}
                  style={{ textAlign: 'left', padding: '15px' }}
                >
                  <strong style={{ display: 'block', fontSize: '1.1em' }}>{p.organizationName}</strong>
                  <small style={{ opacity: 0.8 }}>Espace {p.organizationType || "Membre"}</small>
                </button>
              ))}
            </div>
            {error && <p className="member-message" style={{ color: "var(--danger)", marginTop: 20 }}>{error}</p>}
            <button 
              className="button button-small" 
              onClick={() => setProfiles(null)}
              style={{ marginTop: 20, background: 'transparent', border: 'none', textDecoration: 'underline' }}
            >
              ← Utiliser un autre numéro
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
