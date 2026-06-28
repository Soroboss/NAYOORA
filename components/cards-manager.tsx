"use client";
import { FormEvent, useState, useEffect } from 'react';

async function send(x: object) {
  const r = await fetch('/api/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(x)
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.error);
  return d;
}

export function CardsManager({ template, cards, canManage, logoUrl }: { template: any; cards: any[]; canManage: boolean; logoUrl?: string }) {
  const [n, setN] = useState('');
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState(template || {
    theme: 'modern',
    primary_color: '#1e40af',
    validity_months: 12
  });
  const [extracting, setExtracting] = useState(false);

  const extractColorFromLogo = () => {
    if (!logoUrl) return alert("Aucun logo défini pour cette organisation.");
    
    let resolvedLogoUrl = logoUrl;
    if (!resolvedLogoUrl.startsWith('http')) {
      // It's likely a Supabase storage path
      resolvedLogoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/organization-logos/${resolvedLogoUrl}`;
    }

    setExtracting(true);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return setExtracting(false);
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i+3] > 128) {
          r += data[i];
          g += data[i+1];
          b += data[i+2];
          count++;
        }
      }
      
      if (count > 0) {
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
        const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        setSettings({ ...settings, primary_color: hex });
      }
      setExtracting(false);
    };
    img.onerror = () => {
      alert("Erreur lors de l'analyse du logo. L'image n'a pas pu être chargée ou a un fond bloquant.");
      setExtracting(false);
    };
    img.src = resolvedLogoUrl;
  };

  async function sub(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      await send({ action: 'template', ...settings });
      setN('Modèle enregistré avec succès.');
    } catch (e) {
      setN(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  async function status(id: string, value: string) {
    setBusy(true);
    try {
      await send({ action: 'status', cardId: id, status: value });
      setN('Statut de carte mis à jour. Actualisez la page.');
    } catch (e) {
      setN(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="finance-workspace">
      {canManage && (
        <div className="finance-forms">
          <form className="panel compact-form" onSubmit={sub}>
            <p className="eyebrow">Personnalisation</p>
            <h2>Modèle de carte</h2>
            
            <label style={{ display: 'block', marginBottom: '16px' }}>
              Modèle visuel
              <select 
                value={settings.theme} 
                onChange={e => setSettings({...settings, theme: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="modern">🚀 Moderne (Épuré & Clair)</option>
                <option value="classic">🏛️ Classique (Traditionnel)</option>
                <option value="elegant">✨ Élégant (Sombre & Premium)</option>
              </select>
            </label>

            <label style={{ display: 'block', marginBottom: '16px' }}>
              Durée de validité
              <select 
                value={settings.validity_months} 
                onChange={e => setSettings({...settings, validity_months: Number(e.target.value)})}
                style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value={12}>1 an (Standard)</option>
                <option value={24}>2 ans</option>
                <option value={36}>3 ans</option>
                <option value={60}>5 ans (Longue durée)</option>
              </select>
            </label>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px' }}>Couleur principale</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="color" 
                  value={settings.primary_color} 
                  onChange={e => setSettings({...settings, primary_color: e.target.value})}
                  style={{ width: '40px', height: '40px', padding: '0', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
                <input 
                  type="text" 
                  value={settings.primary_color.toUpperCase()} 
                  onChange={e => setSettings({...settings, primary_color: e.target.value})}
                  style={{ width: '100px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'monospace' }}
                />
                {logoUrl && (
                  <button 
                    type="button" 
                    onClick={extractColorFromLogo}
                    disabled={extracting}
                    style={{ padding: '8px 12px', fontSize: '13px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    {extracting ? "Calcul..." : "🪄 Couleur du logo"}
                  </button>
                )}
              </div>
            </div>
            
            <button disabled={busy} className="button button-dark">Enregistrer le modèle</button>
          </form>

          <article className="panel">
            <p className="eyebrow">Aperçu en direct</p>
            <h2>Visuel du modèle</h2>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', backgroundColor: '#f3f4f6', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              {settings.theme === 'elegant' && (
                <div style={{ display: 'flex', width: '100%', maxWidth: '340px', backgroundColor: '#111827', borderRadius: '12px', border: `3px solid ${settings.primary_color}`, overflow: 'hidden', color: '#fff', aspectRatio: '1.58', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                  <div style={{ width: '35%', backgroundColor: settings.primary_color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#fff', borderRadius: '8px' }}></div>
                  </div>
                  <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '10px', color: settings.primary_color, textTransform: 'uppercase', fontWeight: 'bold' }}>Organisation</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>Prénom Nom</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>Titre / Rôle</div>
                  </div>
                </div>
              )}
              {settings.theme === 'classic' && (
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '340px', backgroundColor: '#f9fafb', borderRadius: '12px', border: `3px solid ${settings.primary_color}`, overflow: 'hidden', color: '#1f2937', aspectRatio: '1.58', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                  <div style={{ padding: '12px', backgroundColor: settings.primary_color, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', backgroundColor: '#fff', borderRadius: '4px' }}></div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Organisation</div>
                  </div>
                  <div style={{ padding: '16px', flex: 1 }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: settings.primary_color }}>Prénom Nom</div>
                    <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '2px' }}>Titre / Rôle</div>
                  </div>
                </div>
              )}
              {settings.theme === 'modern' && (
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '340px', backgroundColor: '#ffffff', borderRadius: '12px', border: `3px solid ${settings.primary_color}`, overflow: 'hidden', color: '#1f2937', aspectRatio: '1.58', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                  <div style={{ padding: '16px', backgroundColor: settings.primary_color, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', backgroundColor: '#fff', borderRadius: '6px' }}></div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Organisation</div>
                  </div>
                  <div style={{ padding: '16px', flex: 1, display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', backgroundColor: '#e5e7eb', borderRadius: '8px', border: `3px solid ${settings.primary_color}`, marginRight: '16px' }}></div>
                    <div style={{ flex: 1 }}>
                       <div style={{ fontSize: '18px', fontWeight: 'bold', color: settings.primary_color }}>Prénom Nom</div>
                       <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>Titre / Rôle</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '12px', textAlign: 'center' }}>
              Ceci est un aperçu simplifié. La vraie carte contiendra les photos, QR codes et informations complètes.
            </p>
          </article>
        </div>
      )}

      {n && <p className="member-message">{n}</p>}

      <article className="panel">
        <p className="eyebrow">Cartes émises</p>
        <h2>Registre</h2>
        <div className="finance-list">
          {cards.map(c => (
            <div key={c.id}>
              <span>
                <b>{c.member?.first_name} {c.member?.last_name}</b>
                <small>{c.card_number} · <a href={`/card/${c.qr_token}`} target="_blank" rel="noreferrer">Vérifier</a></small>
              </span>
              {canManage ? (
                <button 
                  className="button" 
                  disabled={busy} 
                  onClick={() => status(c.id, c.status === 'active' ? 'blocked' : 'active')}
                >
                  {c.status === 'active' ? 'Bloquer' : 'Réactiver'}
                </button>
              ) : (
                <b>{c.status}</b>
              )}
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
