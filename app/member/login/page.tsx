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
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const router = useRouter();

  async function login(e?: FormEvent, selectedMemberId?: string) {
    if (e) e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload: any = { phone, pin: pin.trim() };
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
    <>
      <style>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100dvh;
          background-color: #f9fafb;
          padding: 1rem;
        }
        .auth-card {
          width: 100%;
          max-width: 440px;
          background-color: white;
          padding: 2rem 1.5rem;
          border-radius: 1.5rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        @media (min-width: 480px) {
          .auth-card {
            padding: 3rem 2.5rem;
          }
        }
        .auth-logo {
          height: 80px;
          width: auto;
          max-width: 100%;
          margin: 0 auto;
          display: block;
        }
        @media (min-width: 480px) {
          .auth-logo {
            height: 90px;
          }
        }
      `}</style>
      <main className="auth-container">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <Link href="/" style={{ display: 'inline-block', transition: 'transform 0.2s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
              <img src="/nayoora-logo.png" alt="NAYOORA" className="auth-logo" />
            </Link>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginTop: '1.5rem', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
              Espace Membre
            </h1>
            <p style={{ color: '#4b5563', fontSize: '1rem', lineHeight: 1.5 }}>
              Saisissez votre numéro de téléphone pour accéder à votre espace personnel.
            </p>
          </div>
          
          {!profiles ? (
            <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                  Numéro de téléphone
                </label>
                <input 
                  type="tel" 
                  required 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="Ex: +225 01 02 03 04" 
                  style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1.5px solid #e5e7eb', fontSize: '1.05rem', outline: 'none', transition: 'all 0.2s ease', backgroundColor: '#f9fafb' }}
                  onFocus={e => { e.target.style.borderColor = '#111827'; e.target.style.backgroundColor = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(17, 24, 39, 0.1)' }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#f9fafb'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                  Code PIN (4 chiffres)
                </label>
                <input 
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin} 
                  onChange={(e) => setPin(e.target.value)} 
                  placeholder="Ex: 0000 (Laissez vide pour la 1ère fois)" 
                  style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1.5px solid #e5e7eb', fontSize: '1.05rem', outline: 'none', transition: 'all 0.2s ease', backgroundColor: '#f9fafb' }}
                  onFocus={e => { e.target.style.borderColor = '#111827'; e.target.style.backgroundColor = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(17, 24, 39, 0.1)' }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#f9fafb'; e.target.style.boxShadow = 'none' }}
                />
              </div>
              
              {error && (
                <div style={{ padding: '1rem', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '0.5rem', color: '#b91c1c', fontSize: '0.9rem', fontWeight: 500 }}>
                  {error}
                </div>
              )}
              
              <button 
                disabled={busy} 
                style={{ width: '100%', padding: '1rem', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1.05rem', fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1, transition: 'background-color 0.2s ease, transform 0.1s ease', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                onMouseOver={e => !busy && (e.currentTarget.style.backgroundColor = '#374151')}
                onMouseOut={e => !busy && (e.currentTarget.style.backgroundColor = '#111827')}
                onMouseDown={e => !busy && (e.currentTarget.style.transform = 'scale(0.98)')}
                onMouseUp={e => !busy && (e.currentTarget.style.transform = 'scale(1)')}
              >
                {busy ? "Recherche en cours..." : "Continuer"}
              </button>
            </form>
          ) : (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3.5rem', height: '3.5rem', borderRadius: '50%', backgroundColor: '#f3f4f6', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  👋
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>Content de vous revoir !</h2>
                <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Lequel de vos espaces souhaitez-vous ouvrir ?</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {profiles.map((p) => (
                  <button 
                    key={p.memberId} 
                    onClick={() => login(undefined, p.memberId)}
                    disabled={busy}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '1.25rem', backgroundColor: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '0.75rem', cursor: busy ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', textAlign: 'left' }}
                    onMouseOver={e => !busy && (e.currentTarget.style.borderColor = '#111827', e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)')}
                    onMouseOut={e => !busy && (e.currentTarget.style.borderColor = '#e5e7eb', e.currentTarget.style.boxShadow = 'none')}
                    onMouseDown={e => !busy && (e.currentTarget.style.transform = 'scale(0.98)')}
                    onMouseUp={e => !busy && (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <div>
                      <strong style={{ display: 'block', color: '#111827', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.25rem' }}>{p.organizationName}</strong>
                      <span style={{ color: '#6b7280', fontSize: '0.9rem', textTransform: 'capitalize' }}>Espace {p.organizationType || "Membre"}</span>
                    </div>
                    <span style={{ color: '#9ca3af', fontSize: '1.25rem' }}>→</span>
                  </button>
                ))}
              </div>

              {error && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '0.5rem', color: '#b91c1c', fontSize: '0.9rem', fontWeight: 500 }}>
                  {error}
                </div>
              )}
              
              <button 
                onClick={() => setProfiles(null)}
                style={{ display: 'block', width: '100%', marginTop: '1.5rem', padding: '1rem', background: 'transparent', border: 'none', color: '#6b7280', fontSize: '0.95rem', cursor: 'pointer', transition: 'color 0.2s ease', fontWeight: 500 }}
                onMouseOver={e => e.currentTarget.style.color = '#111827'}
                onMouseOut={e => e.currentTarget.style.color = '#6b7280'}
              >
                ← Utiliser un autre numéro
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
