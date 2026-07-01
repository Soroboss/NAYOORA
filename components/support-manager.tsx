"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";

async function send(payload: object) {
  const response = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Opération impossible.");
  return data;
}

export function SupportManager({ requests, canManage }: { requests: any[]; canManage: boolean }) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      await send(Object.fromEntries(new FormData(event.currentTarget)));
      setNotice("Requête envoyée aux propriétaires NAYOORA.");
      ((event.target || event.currentTarget) as HTMLFormElement | null)?.reset();
    } catch (error) {
      const __msg = error instanceof Error ? error.message : "Erreur inconnue."; toast.error(__msg); setNotice(__msg);
    } finally {
      setBusy(false);
    }
  }

  return <div className="finance-workspace">
    {canManage && <form className="panel compact-form" onSubmit={submit}>
      <p className="eyebrow">Support NAYOORA</p>
      <h2>Envoyer une requête</h2>
      <select name="requestType"><option value="support">Support</option><option value="billing">Facturation</option><option value="upgrade">Changement d’offre</option><option value="technical">Technique</option><option value="security">Sécurité</option></select>
      <select name="priority"><option value="normal">Normal</option><option value="high">Important</option><option value="urgent">Urgent</option><option value="low">Faible</option></select>
      <input required name="title" placeholder="Objet de la demande" />
      <textarea name="description" placeholder="Expliquez votre besoin, problème ou demande…" />
      <button className="button button-dark" disabled={busy}>Envoyer</button>
    </form>}
    {notice && <p className="member-message">{notice}</p>}
    <article className="panel">
      <p className="eyebrow">Historique</p>
      <h2>Vos requêtes</h2>
      <div className="finance-list">{requests.map((item) => <div key={item.id}><span><b>{item.title}</b><small>{item.request_type} · {new Date(item.created_at).toLocaleDateString("fr-FR")}</small>{item.resolution && <small>Réponse : {item.resolution}</small>}</span><b>{item.status}</b></div>)}</div>
    </article>
  </div>;
}
