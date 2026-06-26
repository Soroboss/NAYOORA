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
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '440px', backgroundColor: 'white', padding: '3rem 2rem', borderRadius: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link href="/" style={{ display: 'inline-block', transition: 'transform 0.2s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
            <img src="/nayoora-logo.png" alt="NAYOORA" style={{ height: '54px', width: 'auto', margin: '0 auto' }} />
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
            Espace Membre
          </h1>
          <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Saisissez votre numéro de téléphone pour accéder à votre espace personnel.
          </p>
        </div>
        
        {!profiles ? (
          <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                Numéro de téléphone
              </label>
              <input 
                type="tel" 
                required 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="Ex: +225 01 02 03 04" 
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #d1d5db', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s ease, box-shadow 0.2s ease' }}
                onFocus={e => { e.target.style.borderColor = '#000'; e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            
            {error && (
              <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '0.5rem', color: '#b91c1c', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            
            <button 
              disabled={busy} 
              style={{ width: '100%', padding: '0.875rem', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1, transition: 'background-color 0.2s ease' }}
              onMouseOver={e => !busy && (e.currentTarget.style.backgroundColor = '#374151')}
              onMouseOut={e => !busy && (e.currentTarget.style.backgroundColor = '#111827')}
            >
              {busy ? "Connexion en cours..." : "Continuer"}
            </button>
          </form>
        ) : (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3rem', height: '3rem', borderRadius: '50%', backgroundColor: '#f3f4f6', marginBottom: '1rem' }}>
                👋
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>Content de vous revoir !</h2>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Nous avons trouvé plusieurs profils. Lequel souhaitez-vous ouvrir ?</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {profiles.map((p) => (
                <button 
                  key={p.memberId} 
                  onClick={() => login(undefined, p.memberId)}
                  disabled={busy}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '1rem', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.75rem', cursor: busy ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', textAlign: 'left' }}
                  onMouseOver={e => !busy && (e.currentTarget.style.borderColor = '#000', e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)')}
                  onMouseOut={e => !busy && (e.currentTarget.style.borderColor = '#e5e7eb', e.currentTarget.style.boxShadow = 'none')}
                >
                  <div>
                    <strong style={{ display: 'block', color: '#111827', fontSize: '1rem', fontWeight: 600 }}>{p.organizationName}</strong>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'capitalize' }}>Espace {p.organizationType || "Membre"}</span>
                  </div>
                  <span style={{ color: '#9ca3af' }}>→</span>
                </button>
              ))}
            </div>

            {error && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '0.5rem', color: '#b91c1c', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            
            <button 
              onClick={() => setProfiles(null)}
              style={{ display: 'block', width: '100%', marginTop: '1.5rem', padding: '0.75rem', background: 'transparent', border: 'none', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer', transition: 'color 0.2s ease' }}
              onMouseOver={e => e.currentTarget.style.color = '#111827'}
              onMouseOut={e => e.currentTarget.style.color = '#6b7280'}
            >
              ← Revenir et utiliser un autre numéro
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
