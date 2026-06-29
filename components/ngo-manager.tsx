"use client";
import { FormEvent, useState } from 'react';

async function send(x: object) {
  const r = await fetch('/api/ngo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(x) });
  const d = await r.json();
  if (!r.ok) throw Error(d.error);
  return d;
}

export function NgoManager({ projects, beneficiaries, donors, canManage }: { projects: any[]; beneficiaries: any[]; donors: any[]; canManage: boolean }) {
  const [n, setN] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("projets");

  async function sub(e: FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    setBusy(true);
    try {
      await send({ action, ...Object.fromEntries(new FormData(e.currentTarget)) });
      setN('Enregistrement effectué. Actualisez la page pour actualiser les listes.');
      e.currentTarget.reset();
    } catch (e) {
      setN(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="finance-workspace">
      <div className="finance-stats">
        <article>
          <p>Projets</p>
          <strong>{projects.length}</strong>
        </article>
        <article>
          <p>Bénéficiaires</p>
          <strong>{beneficiaries.length}</strong>
        </article>
        <article>
          <p>Donateurs</p>
          <strong>{donors.length}</strong>
        </article>
      </div>

      <div className="tabs" style={{ display: "flex", gap: "16px", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
        <button onClick={() => setActiveTab("projets")} style={{ padding: "12px 16px", borderBottom: activeTab === "projets" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "projets" ? "bold" : "normal" }}>Projets</button>
        <button onClick={() => setActiveTab("beneficiaires")} style={{ padding: "12px 16px", borderBottom: activeTab === "beneficiaires" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "beneficiaires" ? "bold" : "normal" }}>Bénéficiaires</button>
        <button onClick={() => setActiveTab("donateurs")} style={{ padding: "12px 16px", borderBottom: activeTab === "donateurs" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "donateurs" ? "bold" : "normal" }}>Donateurs</button>
      </div>

      {n && <p className="member-message">{n}</p>}

      <div style={{ display: "grid", gridTemplateColumns: canManage ? "2fr 1fr" : "1fr", gap: "24px", alignItems: "start" }}>
        
        {activeTab === "projets" && (
          <>
            <article className="panel">
              <p className="eyebrow">Projets</p>
              <h2>Portefeuille</h2>
              <div className="finance-list" style={{ maxHeight: "600px", overflowY: "auto" }}>
                {projects.length === 0 ? <p className="muted">Aucun projet.</p> : projects.map(p => (
                  <div key={p.id}>
                    <span>
                      <b>{p.name}</b>
                      <small>{p.code || 'Sans code'} · {p.starts_at || 'Date à définir'}</small>
                    </span>
                    <b>{p.status}</b>
                  </div>
                ))}
              </div>
            </article>

            {canManage && (
              <form className="panel compact-form" onSubmit={e => sub(e, 'project')}>
                <p className="eyebrow">Projets</p>
                <h2>Créer un projet</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                  <input name="code" placeholder="Code projet" style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                  <input required name="name" placeholder="Nom du projet" style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                  <select name="status" style={{ width: "100%", padding: "8px", borderRadius: "6px" }}>
                    <option value="draft">Brouillon</option>
                    <option value="active">Actif</option>
                    <option value="paused">En pause</option>
                  </select>
                  <input name="startsAt" type="date" style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                  <button disabled={busy} className="button button-dark" style={{ width: "100%" }}>Créer</button>
                </div>
              </form>
            )}
          </>
        )}

        {activeTab === "beneficiaires" && (
          <>
            <article className="panel">
              <p className="eyebrow">Bénéficiaires</p>
              <h2>Personnes accompagnées</h2>
              <div className="finance-list" style={{ maxHeight: "600px", overflowY: "auto" }}>
                {beneficiaries.length === 0 ? <p className="muted">Aucun bénéficiaire.</p> : beneficiaries.map(b => (
                  <div key={b.id}>
                    <span>
                      <b>{b.full_name}</b>
                      <small>{b.project?.name || 'Sans projet'} · {b.phone || 'Sans contact'}</small>
                    </span>
                  </div>
                ))}
              </div>
            </article>

            {canManage && (
              <form className="panel compact-form" onSubmit={e => sub(e, 'beneficiary')}>
                <p className="eyebrow">Bénéficiaires</p>
                <h2>Ajouter une personne</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                  <input required name="name" placeholder="Nom complet" style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                  <input name="phone" placeholder="Téléphone" style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                  <select name="projectId" style={{ width: "100%", padding: "8px", borderRadius: "6px" }}>
                    <option value="">Sans projet assigné</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input name="category" placeholder="Catégorie / profil" style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                  <button disabled={busy} className="button button-dark" style={{ width: "100%" }}>Ajouter</button>
                </div>
              </form>
            )}
          </>
        )}

        {activeTab === "donateurs" && (
          <>
            <article className="panel">
              <p className="eyebrow">Donateurs</p>
              <h2>Partenaires</h2>
              <div className="finance-list" style={{ maxHeight: "600px", overflowY: "auto" }}>
                {donors.length === 0 ? <p className="muted">Aucun donateur.</p> : donors.map(d => (
                  <div key={d.id}>
                    <span>
                      <b>{d.name}</b>
                      <small>{d.email || d.phone || 'Sans contact'}</small>
                    </span>
                    <b>{d.donor_type}</b>
                  </div>
                ))}
              </div>
            </article>

            {canManage && (
              <form className="panel compact-form" onSubmit={e => sub(e, 'donor')}>
                <p className="eyebrow">Donateurs</p>
                <h2>Ajouter un donateur</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                  <input required name="name" placeholder="Nom ou organisation" style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                  <select required name="type" style={{ width: "100%", padding: "8px", borderRadius: "6px" }}>
                    <option value="">Type</option>
                    <option value="individual">Particulier</option>
                    <option value="company">Entreprise</option>
                    <option value="institution">Institution</option>
                  </select>
                  <input name="email" type="email" placeholder="Email" style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                  <input name="phone" placeholder="Téléphone" style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                  <button disabled={busy} className="button button-dark" style={{ width: "100%" }}>Ajouter</button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
