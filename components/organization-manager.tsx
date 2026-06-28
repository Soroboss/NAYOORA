"use client";
import { FormEvent, useState, ChangeEvent } from 'react';

const modules = [
  ['members', 'Membres'],
  ['cards', 'Cartes de membre'],
  ['contributions', 'Cotisations'],
  ['finance', 'Caisse & paiements'],
  ['loans', 'Prêts & créances'],
  ['solidarity', 'Solidarité'],
  ['events', 'Événements'],
  ['messages', 'Messages'],
  ['reports', 'Rapports']
];

async function send(x: object) {
  const r = await fetch('/api/organization', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(x)
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.error);
  return d;
}

export function OrganizationManager({ organization, modules: initial, settings, canManage }: { organization: any; modules: any[]; settings: any; canManage: boolean }) {
  const [n, setN] = useState('');
  const [busy, setBusy] = useState(false);
  const [mods, setMods] = useState<Record<string, boolean>>(Object.fromEntries(initial.map(x => [x.module_code, x.active])));
  const [logoUrl, setLogoUrl] = useState(organization?.logo_url || '');

  async function sub(e: FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload: any = { action, ...Object.fromEntries(new FormData(e.currentTarget)) };
      if (action === 'profile') payload.logoUrl = logoUrl;
      
      await send(payload);
      setN('Paramètres enregistrés.');
    } catch (e) {
      setN(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(code: string) {
    setBusy(true);
    const active = !(mods[code] ?? true);
    try {
      await send({ action: 'module', code, active });
      setMods({ ...mods, [code]: active });
      setN('Module mis à jour.');
    } catch (e) {
      setN(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setN("Le fichier choisi doit être une image.");
    if (file.size > 2_000_000) return setN("Logo trop lourd. Utilisez une image inférieure à 2 Mo.");
    
    setBusy(true);
    setN("Upload du logo en cours…");
    try {
      const { createClient } = await import("@/lib/insforge/client");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `organizations/${organization.id}/logo-${crypto.randomUUID()}-${safeName}`;
      const client = createClient();
      if (!client) throw new Error("Client non configuré.");
      
      // On utilise le bucket "member-photos" pour stocker le logo pour des raisons de simplicité
      const bucket = client.storage.from("member-photos");
      const { data, error } = await bucket.upload(path, file);
      if (error) throw error;
      
      const publicUrl = data?.url ?? bucket.getPublicUrl(path).data?.publicUrl ?? path;
      setLogoUrl(publicUrl);
      setN("Logo uploadé avec succès. N'oubliez pas de cliquer sur Enregistrer.");
    } catch (error) {
      setN(error instanceof Error ? error.message : "Upload impossible.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return (
    <div className="finance-workspace">
      {canManage && (
        <div className="finance-forms">
          <form className="panel compact-form" onSubmit={e => sub(e, 'profile')}>
            <p className="eyebrow">Profil</p>
            <h2>Identité de l’organisation</h2>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ width: 64, height: 64, borderRadius: '8px', objectFit: 'contain', background: '#f8fafc', border: '1px solid #e2e8f0' }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: '8px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏢</div>
              )}
              <label className="button button-outline" style={{ cursor: 'pointer' }}>
                Changer le logo
                <input disabled={busy} type="file" accept="image/*" onChange={uploadLogo} style={{ display: 'none' }} />
              </label>
            </div>

            <input required name="name" defaultValue={organization?.name} placeholder="Nom de l'organisation" />
            <textarea name="description" defaultValue={organization?.description || ''} placeholder="Description ou devise de l'organisation" rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <input name="phone" defaultValue={organization?.phone || ''} placeholder="Téléphone officiel" />
            <input name="email" defaultValue={organization?.email || ''} placeholder="Email officiel" />
            <input name="country" defaultValue={organization?.country_code || 'CI'} placeholder="Code pays (ex: CI)" />
            <input name="currency" defaultValue={organization?.currency || 'XOF'} placeholder="Devise (ex: XOF)" />
            
            <button disabled={busy} className="button button-dark">Enregistrer le profil</button>
          </form>

          <article className="panel channel-note">
            <p className="eyebrow">Modules</p>
            <h2>Fonctionnalités actives</h2>
            <div className="module-list">
              {modules.map(([code, label]) => (
                <label key={code}>
                  <span>{label}</span>
                  <input disabled={busy} type="checkbox" checked={mods[code] ?? true} onChange={() => toggle(code)} />
                </label>
              ))}
            </div>
          </article>

          <form className="panel compact-form" onSubmit={e => sub(e, 'operations')}>
            <p className="eyebrow">Opérations</p>
            <h2>Règles de travail</h2>
            <input name="timezone" defaultValue={settings?.timezone || 'Africa/Abidjan'} placeholder="Fuseau horaire" />
            <input name="fiscalYear" type="number" min="1" max="12" defaultValue={settings?.fiscal_year_start || 1} placeholder="Mois début exercice (1-12)" />
            <input name="prefix" defaultValue={settings?.member_number_prefix || ''} placeholder="Préfixe des matricules automatiques" />
            <input name="paymentMethod" defaultValue={settings?.data?.default_payment_method || 'cash'} placeholder="Mode de paiement par défaut" />
            
            <label className="check-line">
              <input name="emailEnabled" type="checkbox" value="true" defaultChecked={settings?.data?.channels?.email !== false} /> Activer les emails
            </label>
            <label className="check-line">
              <input name="whatsappEnabled" type="checkbox" value="true" defaultChecked={settings?.data?.channels?.whatsapp === true} /> Activer WhatsApp
            </label>
            <label className="check-line">
              <input name="mobileMoneyEnabled" type="checkbox" value="true" defaultChecked={settings?.data?.payments?.mobile_money === true} /> Activer Mobile Money
            </label>
            
            <input name="whatsappSender" defaultValue={settings?.data?.channels?.whatsapp_sender || ''} placeholder="Numéro WhatsApp expéditeur" />
            <input name="merchantReference" defaultValue={settings?.data?.payments?.merchant_reference || ''} placeholder="Référence marchand Mobile Money" />
            
            <button disabled={busy} className="button button-dark">Enregistrer les opérations</button>
          </form>
        </div>
      )}

      {n && <p className="member-message" style={{ background: '#10b981', color: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>{n}</p>}

      <article className="panel">
        <p className="eyebrow">Résumé</p>
        <h2>Configuration actuelle</h2>
        <div className="finance-list">
          <div>
            <span><b>Type d’organisation</b><small>Configuration initiale choisie à l’onboarding</small></span>
            <b>{organization?.organization_type}</b>
          </div>
          <div>
            <span><b>Modules activés</b><small>Les modules désactivés restent masqués pour les utilisateurs.</small></span>
            <b>{Object.values(mods).filter(Boolean).length}</b>
          </div>
          <div>
            <span><b>Canaux</b><small>Email, WhatsApp et Mobile Money configurables par tenant.</small></span>
            <b>{settings?.data?.channels?.whatsapp ? 'WhatsApp actif' : 'Standard'}</b>
          </div>
        </div>
      </article>
    </div>
  );
}
