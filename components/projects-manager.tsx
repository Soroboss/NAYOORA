"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";

async function send(x: object) {
  const r = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(x),
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.error);
  return d;
}

export function ProjectsManager({ projects, canManage }: { projects: any[]; canManage: boolean }) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function sub(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = Object.fromEntries(new FormData(e.currentTarget));
      await send({ action: "project", ...payload });
      setNotice("Projet enregistré avec succès.");
      ((e.target || e.currentTarget) as HTMLFormElement | null)?.reset();
    } catch (err) {
      const __msg = err instanceof Error ? err.message : "Erreur."; toast.error(__msg); setNotice(__msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="finance-workspace">
      {canManage && (
        <div className="finance-forms">
          <form className="panel compact-form" onSubmit={sub}>
            <p className="eyebrow">Nouveau</p>
            <h2>Créer un projet</h2>
            <input required name="name" placeholder="Nom du projet" />
            <textarea name="description" placeholder="Description du projet..." />
            <input name="startsAt" type="date" title="Date de début" />
            <input name="endsAt" type="date" title="Date de fin prévue" />
            <button disabled={busy} className="button button-dark">
              Enregistrer
            </button>
          </form>
        </div>
      )}
      
      {notice && <p className="member-message">{notice}</p>}
      
      <article className="panel">
        <p className="eyebrow">Portefeuille</p>
        <h2>Projets en cours</h2>
        <div className="finance-list">
          {projects.map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1rem', borderBottom: '1px solid #eee' }}>
              <div>
                <span>
                  <b>{p.name}</b>
                  <small>
                    {p.description ? p.description.substring(0, 50) + "..." : "Aucune description"} · <strong style={{color: p.status === 'draft' ? '#6b7280' : p.status === 'active' ? '#10b981' : p.status === 'paused' ? '#f59e0b' : p.status === 'completed' ? '#3b82f6' : '#ef4444'}}>{p.status}</strong>
                  </small>
                </span>
                <b>{p.starts_at ? new Date(p.starts_at).toLocaleDateString("fr-FR") : "Non définie"}</b>
              </div>
              {canManage && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {p.status !== 'completed' && (
                    <button className="button button-small" onClick={() => {
                      if(confirm("Marquer ce projet comme terminé ?")) {
                        const fd = new FormData(); fd.append('projectId', p.id); fd.append('status', 'completed');
                        send({ action: "update_project", ...Object.fromEntries(fd) })
                          .then(() => window.location.reload())
                          .catch(e => toast.error(e.message));
                      }
                    }}>Terminer</button>
                  )}
                  {p.status === 'active' && (
                    <button className="button button-small" style={{borderColor:'#f59e0b', color:'#f59e0b'}} onClick={() => {
                      if(confirm("Mettre ce projet en pause ?")) {
                        const fd = new FormData(); fd.append('projectId', p.id); fd.append('status', 'paused');
                        send({ action: "update_project", ...Object.fromEntries(fd) })
                          .then(() => window.location.reload())
                          .catch(e => toast.error(e.message));
                      }
                    }}>Mettre en pause</button>
                  )}
                  {p.status === 'paused' && (
                    <button className="button button-small" style={{borderColor:'#10b981', color:'#10b981'}} onClick={() => {
                      if(confirm("Relancer ce projet ?")) {
                        const fd = new FormData(); fd.append('projectId', p.id); fd.append('status', 'active');
                        send({ action: "update_project", ...Object.fromEntries(fd) })
                          .then(() => window.location.reload())
                          .catch(e => toast.error(e.message));
                      }
                    }}>Relancer</button>
                  )}
                  {p.status === 'draft' && (
                    <button className="button button-small" style={{borderColor:'#10b981', color:'#10b981'}} onClick={() => {
                      if(confirm("Démarrer ce projet ?")) {
                        const fd = new FormData(); fd.append('projectId', p.id); fd.append('status', 'active');
                        send({ action: "update_project", ...Object.fromEntries(fd) })
                          .then(() => window.location.reload())
                          .catch(e => toast.error(e.message));
                      }
                    }}>Démarrer</button>
                  )}
                </div>
              )}
            </div>
          ))}
          {!projects.length && (
            <div>
              <span><b>Aucun projet enregistré</b></span>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
