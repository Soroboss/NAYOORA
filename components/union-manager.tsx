"use client";
import { FormEvent, useState } from 'react';

async function send(x: object) {
  const r = await fetch('/api/union', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(x) });
  const d = await r.json();
  if (!r.ok) throw Error(d.error);
  return d;
}

export function UnionManager({ sectors, claims, mobilizations, canManage }: { sectors: any[]; claims: any[]; mobilizations: any[]; canManage: boolean }) {
  const [n, setN] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("revendications");

  async function sub(e: FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    setBusy(true);
    try {
      await send({ action, ...Object.fromEntries(new FormData(e.currentTarget)) });
      setN('Enregistrement effectué. Actualisez la page pour voir la liste à jour.');
      ((e.target || e.currentTarget) as HTMLFormElement | null)?.reset();
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
          <p>Secteurs</p>
          <strong>{sectors.length}</strong>
        </article>
        <article>
          <p>Revendications ouvertes</p>
          <strong>{claims.filter(c => c.status !== 'closed').length}</strong>
        </article>
        <article>
          <p>Mobilisations</p>
          <strong>{mobilizations.length}</strong>
        </article>
      </div>

      <div className="tabs" style={{ display: "flex", gap: "16px", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
        <button onClick={() => setActiveTab("revendications")} style={{ padding: "12px 16px", borderBottom: activeTab === "revendications" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "revendications" ? "bold" : "normal" }}>Revendications</button>
        <button onClick={() => setActiveTab("mobilisations")} style={{ padding: "12px 16px", borderBottom: activeTab === "mobilisations" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "mobilisations" ? "bold" : "normal" }}>Mobilisations</button>
        {canManage && <button onClick={() => setActiveTab("secteurs")} style={{ padding: "12px 16px", borderBottom: activeTab === "secteurs" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "secteurs" ? "bold" : "normal" }}>Secteurs</button>}
      </div>

      {n && <p className="member-message">{n}</p>}

      <div className="module-split" style={{ display: "grid", gridTemplateColumns: canManage ? "2fr 1fr" : "1fr", gap: "24px", alignItems: "start" }}>
        
        {activeTab === "revendications" && (
          <>
            <article className="panel">
              <p className="eyebrow">Revendications</p>
              <h2>Dossiers</h2>
              <div className="finance-list" style={{ maxHeight: "600px", overflowY: "auto" }}>
                {claims.length === 0 ? <p className="muted">Aucune revendication enregistrée.</p> : claims.map(c => (
                  <div key={c.id}>
                    <span>
                      <b>{c.title}</b>
                      <small>{c.sector?.name || 'Tous secteurs'} · {c.opened_at.slice(0, 10)}</small>
                    </span>
                    <b>{c.status}</b>
                  </div>
                ))}
              </div>
            </article>

            {canManage && (
              <form className="panel compact-form" onSubmit={e => sub(e, 'claim')}>
                <p className="eyebrow">Revendications</p>
                <h2>Ouvrir un dossier</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                  <select name="sectorId" style={{ width: "100%", padding: "8px", borderRadius: "6px" }}>
                    <option value="">Tous secteurs</option>
                    {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <input required name="title" placeholder="Objet de la revendication" style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                  <textarea name="description" placeholder="Contexte" style={{ width: "100%", padding: "8px", borderRadius: "6px", minHeight: "100px" }} />
                  <button disabled={busy} className="button button-dark" style={{ width: "100%" }}>Ouvrir le dossier</button>
                </div>
              </form>
            )}
          </>
        )}

        {activeTab === "mobilisations" && (
          <>
            <article className="panel">
              <p className="eyebrow">Mobilisation</p>
              <h2>Actions prévues</h2>
              <div className="finance-list" style={{ maxHeight: "600px", overflowY: "auto" }}>
                {mobilizations.length === 0 ? <p className="muted">Aucune mobilisation prévue.</p> : mobilizations.map(x => (
                  <div key={x.id}>
                    <span>
                      <b>{x.title}</b>
                      <small>{x.sector?.name || 'Tous secteurs'} · {x.location || 'Lieu à confirmer'}</small>
                    </span>
                    <b>{x.status}</b>
                  </div>
                ))}
              </div>
            </article>

            {canManage && (
              <form className="panel compact-form" onSubmit={e => sub(e, 'mobilization')}>
                <p className="eyebrow">Mobilisation</p>
                <h2>Planifier une action</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                  <select name="sectorId" style={{ width: "100%", padding: "8px", borderRadius: "6px" }}>
                    <option value="">Tous secteurs</option>
                    {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <input required name="title" placeholder="Nom de l’action" style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                  <input name="date" type="datetime-local" style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                  <input name="location" placeholder="Lieu" style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                  <button disabled={busy} className="button button-dark" style={{ width: "100%" }}>Planifier</button>
                </div>
              </form>
            )}
          </>
        )}

        {activeTab === "secteurs" && canManage && (
          <>
            <article className="panel">
              <p className="eyebrow">Organisation</p>
              <h2>Secteurs existants</h2>
              <div className="finance-list" style={{ maxHeight: "600px", overflowY: "auto" }}>
                {sectors.length === 0 ? <p className="muted">Aucun secteur défini.</p> : sectors.map(s => (
                  <div key={s.id} style={{ padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <b>{s.name}</b>
                  </div>
                ))}
              </div>
            </article>

            <form className="panel compact-form" onSubmit={e => sub(e, 'sector')}>
              <p className="eyebrow">Secteurs</p>
              <h2>Créer un secteur</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                <input required name="name" placeholder="Ex. Enseignement secondaire" style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                <button disabled={busy} className="button button-dark" style={{ width: "100%" }}>Créer</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
