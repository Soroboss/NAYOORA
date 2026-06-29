"use client";
import { FormEvent, useState, ChangeEvent } from 'react';

const modules = [
  ['members', 'Membres', '👥', 'Gestion des membres et profils'],
  ['cards', 'Cartes de membre', '💳', 'Génération et impression des cartes'],
  ['contributions', 'Cotisations', '💰', 'Suivi des paiements réguliers'],
  ['finance', 'Caisse & paiements', '🏦', 'Trésorerie et flux financiers'],
  ['loans', 'Prêts & créances', '🤝', 'Gestion des prêts aux membres'],
  ['solidarity', 'Solidarité', '❤️', 'Fonds d\'entraide et soutiens'],
  ['events', 'Événements', '📅', 'Organisation et présences'],
  ['messages', 'Messages', '💬', 'Communication multicanale'],
  ['reports', 'Rapports', '📊', 'Statistiques et bilans']
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
    setN('');
    try {
      const payload: any = { action, ...Object.fromEntries(new FormData(e.currentTarget)) };
      if (action === 'profile') payload.logoUrl = logoUrl;
      
      await send(payload);
      setN('Paramètres enregistrés avec succès.');
    } catch (e) {
      setN(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setBusy(false);
      setTimeout(() => setN(''), 4000);
    }
  }

  async function toggle(code: string) {
    setBusy(true);
    const active = !(mods[code] ?? true);
    try {
      await send({ action: 'module', code, active });
      setMods({ ...mods, [code]: active });
    } catch (e) {
      setN(e instanceof Error ? e.message : 'Erreur de mise à jour.');
    } finally {
      setBusy(false);
    }
  }

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setN("Le fichier doit être une image.");
    if (file.size > 2_000_000) return setN("Logo trop lourd (max 2 Mo).");
    
    setBusy(true);
    setN("Téléchargement du logo...");
    try {
      const { createClient } = await import("@/lib/insforge/client");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `organizations/${organization.id}/logo-${crypto.randomUUID()}-${safeName}`;
      const client = createClient();
      if (!client) throw new Error("Client non configuré.");
      
      const bucket = client.storage.from("member-photos");
      const { data, error } = await bucket.upload(path, file);
      if (error) throw error;
      
      const publicUrl = data?.url ?? bucket.getPublicUrl(path).data?.publicUrl ?? path;
      setLogoUrl(publicUrl);
      setN("Logo téléchargé. Cliquez sur Enregistrer.");
    } catch (error) {
      setN(error instanceof Error ? error.message : "Upload impossible.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return (
    <div className="org-manager-layout">
      {n && <div className="toast-notification">{n}</div>}

      <div className="main-content">
        {canManage ? (
          <>
            <form className="glass-panel" onSubmit={e => sub(e, 'profile')}>
              <div className="panel-header">
                <h3>Identité de l'organisation</h3>
                <p>Définissez les informations publiques de votre structure.</p>
              </div>

              <div className="logo-upload-section">
                <div className="logo-preview">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" />
                  ) : (
                    <div className="logo-placeholder">🏢</div>
                  )}
                </div>
                <div className="logo-actions">
                  <label className="btn-upload">
                    Modifier le logo
                    <input disabled={busy} type="file" accept="image/*" onChange={uploadLogo} hidden />
                  </label>
                  <p className="hint">Format JPG, PNG ou SVG. Max 2 Mo.</p>
                </div>
              </div>

              <div className="form-grid">
                <div className="input-group full-width">
                  <label>Nom de l'organisation</label>
                  <input required name="name" defaultValue={organization?.name} placeholder="Ex: Mutuelle de la solidarité" />
                </div>
                
                <div className="input-group">
                  <label>Email officiel</label>
                  <input type="email" name="email" defaultValue={organization?.email || ''} placeholder="contact@organisation.org" />
                </div>
                
                <div className="input-group">
                  <label>Téléphone officiel</label>
                  <input name="phone" defaultValue={organization?.phone || ''} placeholder="+225 00 00 00 00" />
                </div>
                
                <div className="input-group full-width">
                  <label>Description / Devise</label>
                  <textarea name="description" defaultValue={organization?.description || ''} placeholder="Décrivez votre organisation..." rows={3} />
                </div>
              </div>

              <div className="panel-footer">
                <button disabled={busy} className="btn-primary">Enregistrer l'identité</button>
              </div>
            </form>

            <form className="glass-panel" onSubmit={e => sub(e, 'operations')}>
              <div className="panel-header">
                <h3>Paramètres régionaux & Opérations</h3>
                <p>Configurez la devise, les canaux de paiement et la comptabilité.</p>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Pays (Code ISO)</label>
                  <input name="country" defaultValue={organization?.country_code || 'CI'} placeholder="Ex: CI, SN, CM" />
                </div>
                
                <div className="input-group">
                  <label>Devise Principale</label>
                  <input name="currency" defaultValue={organization?.currency || 'XOF'} placeholder="Ex: XOF, EUR, USD" />
                </div>

                <div className="input-group">
                  <label>Fuseau horaire</label>
                  <input name="timezone" defaultValue={settings?.timezone || 'Africa/Abidjan'} placeholder="Ex: Africa/Abidjan" />
                </div>
                
                <div className="input-group">
                  <label>Mois début exercice fiscal (1-12)</label>
                  <input name="fiscalYear" type="number" min="1" max="12" defaultValue={settings?.fiscal_year_start || 1} />
                </div>

                <div className="input-group full-width">
                  <label>Préfixe Matricules</label>
                  <input name="prefix" defaultValue={settings?.member_number_prefix || ''} placeholder="Ex: MEM- (donnera MEM-0001)" />
                </div>
              </div>

              <div className="integrations-section">
                <h4>Canaux & Paiements</h4>
                <div className="toggle-grid">
                  <label className="toggle-card">
                    <div className="toggle-info">
                      <strong>Notifications Email</strong>
                      <span>Envoi automatique d'emails</span>
                    </div>
                    <input name="emailEnabled" type="checkbox" value="true" defaultChecked={settings?.data?.channels?.email !== false} />
                  </label>
                  
                  <label className="toggle-card">
                    <div className="toggle-info">
                      <strong>Notifications WhatsApp</strong>
                      <span>Rappels et reçus via WhatsApp</span>
                    </div>
                    <input name="whatsappEnabled" type="checkbox" value="true" defaultChecked={settings?.data?.channels?.whatsapp === true} />
                  </label>
                  
                  <label className="toggle-card">
                    <div className="toggle-info">
                      <strong>Paiements Mobile Money</strong>
                      <span>Encaissement en ligne (Wave, Orange...)</span>
                    </div>
                    <input name="mobileMoneyEnabled" type="checkbox" value="true" defaultChecked={settings?.data?.payments?.mobile_money === true} />
                  </label>
                </div>
              </div>

              <div className="panel-footer">
                <button disabled={busy} className="btn-primary">Enregistrer les paramètres</button>
              </div>
            </form>

            <article className="glass-panel">
              <div className="panel-header">
                <h3>Modules & Fonctionnalités</h3>
                <p>Activez ou désactivez les outils selon les besoins de votre organisation.</p>
              </div>
              <div className="modules-grid">
                {modules.map(([code, label, icon, desc]) => (
                  <div key={code} className={`module-card ${mods[code] ?? true ? 'active' : ''}`}>
                    <div className="module-icon">{icon}</div>
                    <div className="module-content">
                      <h4>{label}</h4>
                      <p>{desc}</p>
                    </div>
                    <label className="switch">
                      <input disabled={busy} type="checkbox" checked={mods[code] ?? true} onChange={() => toggle(code)} />
                      <span className="slider"></span>
                    </label>
                  </div>
                ))}
              </div>
            </article>
          </>
        ) : (
          <div className="glass-panel"><p>Vous n'avez pas les droits pour modifier la configuration.</p></div>
        )}
      </div>

      <aside className="sidebar-summary">
        <div className="glass-panel sticky">
          <div className="summary-header">
            <h3>Configuration active</h3>
          </div>
          <div className="summary-list">
            <div className="summary-item">
              <span className="label">Type de structure</span>
              <span className="value capitalize">{organization?.organization_type}</span>
            </div>
            <div className="summary-item">
              <span className="label">Modules actifs</span>
              <span className="value">{Object.values(mods).filter(Boolean).length} sur {modules.length}</span>
            </div>
            <div className="summary-item">
              <span className="label">Monnaie</span>
              <span className="value">{organization?.currency}</span>
            </div>
            <div className="summary-item">
              <span className="label">Statut Mobile Money</span>
              <span className="value">{settings?.data?.payments?.mobile_money ? '✅ Activé' : '❌ Désactivé'}</span>
            </div>
          </div>
        </div>
      </aside>

      <style jsx>{`
        .org-manager-layout {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 32px;
          align-items: start;
        }

        .main-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .glass-panel {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          position: relative;
          overflow: hidden;
        }

        .glass-panel::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .glass-panel:hover::before {
          opacity: 1;
        }

        .sticky {
          position: sticky;
          top: 32px;
        }

        .panel-header {
          margin-bottom: 24px;
        }

        .panel-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .panel-header p {
          color: #64748b;
          margin: 0;
          font-size: 0.95rem;
        }

        .logo-upload-section {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid #f1f5f9;
        }

        .logo-preview {
          width: 80px;
          height: 80px;
          border-radius: 16px;
          background: #f8fafc;
          border: 2px dashed #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .logo-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .logo-placeholder {
          font-size: 32px;
        }

        .btn-upload {
          background: #f1f5f9;
          color: #334155;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          display: inline-block;
          transition: background 0.2s;
        }

        .btn-upload:hover {
          background: #e2e8f0;
        }

        .hint {
          font-size: 0.8rem;
          color: #94a3b8;
          margin: 8px 0 0 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .input-group label {
          font-weight: 600;
          font-size: 0.9rem;
          color: #334155;
        }

        .input-group input, .input-group textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          background: #f8fafc;
          font-size: 0.95rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-group input:focus, .input-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: #ffffff;
        }

        .panel-footer {
          margin-top: 32px;
          display: flex;
          justify-content: flex-end;
          padding-top: 24px;
          border-top: 1px solid #f1f5f9;
        }

        .btn-primary {
          background: #0f172a;
          color: white;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.95rem;
          border: none;
          cursor: pointer;
          transition: transform 0.1s, background 0.2s;
        }

        .btn-primary:hover {
          background: #1e293b;
        }

        .btn-primary:active {
          transform: scale(0.98);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Integrations section */
        .integrations-section {
          margin-top: 32px;
          padding-top: 32px;
          border-top: 1px solid #f1f5f9;
        }

        .integrations-section h4 {
          margin: 0 0 16px 0;
          color: #0f172a;
          font-size: 1.1rem;
        }

        .toggle-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .toggle-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .toggle-card:hover {
          background: #f1f5f9;
        }

        .toggle-info strong {
          display: block;
          color: #0f172a;
          font-size: 0.95rem;
          margin-bottom: 4px;
        }

        .toggle-info span {
          color: #64748b;
          font-size: 0.85rem;
        }

        /* Modules Grid */
        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .module-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          transition: all 0.2s ease;
        }

        .module-card.active {
          background: #ffffff;
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
        }

        .module-icon {
          font-size: 24px;
          background: #e0e7ff;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .module-card.active .module-icon {
          background: #3b82f6;
        }

        .module-content {
          flex: 1;
        }

        .module-content h4 {
          margin: 0 0 4px 0;
          font-size: 1rem;
          color: #0f172a;
        }

        .module-content p {
          margin: 0;
          font-size: 0.8rem;
          color: #64748b;
          line-height: 1.3;
        }

        /* Toggle Switch */
        .switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }

        .switch input { 
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #cbd5e1;
          transition: .3s;
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: #3b82f6;
        }

        input:checked + .slider:before {
          transform: translateX(20px);
        }

        /* Summary Sidebar */
        .summary-header h3 {
          margin: 0 0 20px 0;
          font-size: 1.1rem;
          color: #0f172a;
        }

        .summary-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .summary-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .summary-item .label {
          color: #64748b;
          font-size: 0.9rem;
        }

        .summary-item .value {
          font-weight: 600;
          color: #0f172a;
          font-size: 0.95rem;
        }

        .capitalize {
          text-transform: capitalize;
        }

        /* Toast */
        .toast-notification {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #10b981;
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          font-weight: 600;
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
          z-index: 1000;
          animation: slideUp 0.3s ease forwards;
        }

        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 1024px) {
          .org-manager-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          .glass-panel {
            padding: 20px;
          }
          .modules-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
