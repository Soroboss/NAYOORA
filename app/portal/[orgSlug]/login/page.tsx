"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";

export default function PortalLogin({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params);
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orgData, setOrgData] = useState<{name: string} | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Optionally fetch org data directly if needed, for now we just show a generic message until they log in,
    // but the API will validate orgSlug.
    fetch(`/api/public/org?slug=${orgSlug}`)
      .then(res => res.json())
      .then(data => {
        if (data.name) setOrgData(data);
      })
      .catch(() => {});
  }, [orgSlug]);

  async function login(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/portal-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, pin: pin.trim(), orgSlug }),
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Erreur lors de la connexion.");

      router.push(`/portal/${orgSlug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <style>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100dvh;
          background-color: #f3f4f6;
          padding: 1rem;
          background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          background-color: white;
          padding: 2.5rem 2rem;
          border-radius: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>
      <main className="auth-container">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              {orgData ? orgData.name : "Espace Membre"}
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', marginTop: '0.5rem' }}>
              Connectez-vous pour consulter vos informations.
            </p>
          </div>
          
          <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                Email ou Téléphone
              </label>
              <input 
                type="text" 
                required 
                value={identifier} 
                onChange={(e) => setIdentifier(e.target.value)} 
                placeholder="Ex: membre@mail.com ou +225..." 
                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1.5px solid #e5e7eb', fontSize: '1rem', outline: 'none', backgroundColor: '#f9fafb' }}
                onFocus={e => { e.target.style.borderColor = '#111827'; e.target.style.backgroundColor = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#f9fafb'; }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                Code PIN
              </label>
              <input 
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin} 
                onChange={(e) => setPin(e.target.value)} 
                placeholder="Ex: 0000 (Laissez vide la 1ère fois)" 
                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1.5px solid #e5e7eb', fontSize: '1rem', outline: 'none', backgroundColor: '#f9fafb', letterSpacing: '0.1em' }}
                onFocus={e => { e.target.style.borderColor = '#111827'; e.target.style.backgroundColor = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#f9fafb'; }}
              />
            </div>
            
            {error && (
              <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.5rem', color: '#b91c1c', fontSize: '0.875rem', textAlign: 'center' }}>
                {error}
              </div>
            )}
            
            <button 
              disabled={busy} 
              style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1.05rem', fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.8 : 1 }}
            >
              {busy ? "Vérification..." : "Accéder à mon espace"}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/" style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}>
              Propulsé par <b>NAYOORA</b>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
