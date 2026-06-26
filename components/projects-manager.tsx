"use client";

import { FormEvent, useState } from "react";

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
      e.currentTarget.reset();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Erreur.");
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
            <div key={p.id}>
              <span>
                <b>{p.name}</b>
                <small>
                  {p.description ? p.description.substring(0, 50) + "..." : "Aucune description"} · {p.status}
                </small>
              </span>
              <b>{p.starts_at ? new Date(p.starts_at).toLocaleDateString("fr-FR") : "Non définie"}</b>
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
