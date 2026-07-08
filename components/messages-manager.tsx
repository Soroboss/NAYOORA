"use client";
import { FormEvent, useState, useEffect } from 'react';

async function send(x: object) {
  const r = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(x) });
  const d = await r.json();
  if (!r.ok) throw Error(d.error);
  return d;
}

export function MessagesManager({ members, messages, templates = [], debtorIds = [], canManage }: { members: any[]; messages: any[]; templates?: any[]; debtorIds?: string[]; canManage: boolean }) {
  const [n, setN] = useState('');
  const [busy, setBusy] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [activeTab, setActiveTab] = useState("vue");
  const [targetFilter, setTargetFilter] = useState("manual");

  useEffect(() => {
    if (targetFilter === "all") {
      setIds(members.map(m => m.id));
    } else if (targetFilter === "debtors") {
      setIds(members.filter(m => debtorIds.includes(m.id)).map(m => m.id));
    } else {
      setIds([]);
    }
  }, [targetFilter, members, debtorIds]);

  async function sub(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      await send({ ...Object.fromEntries(new FormData(e.currentTarget)), memberIds: ids });
      setN('Message créé. Les messages internes sont disponibles immédiatement ; emails, SMS et WhatsApp restent en file d’envoi jusqu’au raccordement d’un prestataire.');
      ((e.target || e.currentTarget) as HTMLFormElement | null)?.reset();
      setIds([]);
      setBody('');
      setSubject('');
      setTargetFilter("manual");
      setActiveTab("vue");
    } catch (e) {
      setN(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  function applyTemplate(id: string) {
    const t = templates.find(x => x.id === id);
    if (t) {
      setSubject(t.subject || '');
      setBody(t.body || '');
    }
  }

  return (
    <div className="finance-workspace">
      
      <div className="finance-stats">
        <article>
          <p>Total Messages</p>
          <strong>{messages.length}</strong>
        </article>
        <article>
          <p>Membres en retard</p>
          <strong>{debtorIds.length}</strong>
        </article>
        <article>
          <p>Destinataires possibles</p>
          <strong>{members.length}</strong>
        </article>
      </div>

      <div className="tabs" style={{ display: "flex", gap: "16px", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
        <button onClick={() => setActiveTab("vue")} style={{ padding: "12px 16px", borderBottom: activeTab === "vue" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "vue" ? "bold" : "normal" }}>Historique</button>
        {canManage && <button onClick={() => setActiveTab("composer")} style={{ padding: "12px 16px", borderBottom: activeTab === "composer" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "composer" ? "bold" : "normal" }}>Composer</button>}
      </div>

      {n && <p className="member-message">{n}</p>}

      <div className="module-split" style={{ display: "grid", gridTemplateColumns: canManage && activeTab === "composer" ? "2fr 1fr" : "1fr", gap: "24px", alignItems: "start" }}>
        
        {activeTab === "vue" && (
          <article className="panel">
            <p className="eyebrow">Historique</p>
            <h2>Messages récents</h2>
            <div className="finance-list" style={{ maxHeight: "600px", overflowY: "auto" }}>
              {messages.length === 0 ? <p className="muted">Aucun message n'a été envoyé.</p> : messages.map(x => (
                <div key={x.id}>
                  <span>
                    <b>{x.subject || x.body.slice(0, 42)}</b>
                    <small>{x.channel} · {new Date(x.created_at).toLocaleString('fr-FR')}</small>
                  </span>
                  <b>{x.status}</b>
                </div>
              ))}
            </div>
          </article>
        )}

        {activeTab === "composer" && canManage && (
          <>
            <form className="panel compact-form message-form" onSubmit={sub}>
              <p className="eyebrow">Nouveau message</p>
              <h2>Composer</h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <select name="channel">
                  <option value="internal">Notification interne</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
                
                <select value={targetFilter} onChange={(e) => setTargetFilter(e.target.value)}>
                  <option value="manual">Sélection manuelle</option>
                  <option value="all">Tous les membres ({members.length})</option>
                  <option value="debtors">Membres en retard ({debtorIds.length})</option>
                </select>
              </div>
              
              {templates.length > 0 && (
                <select onChange={e => applyTemplate(e.target.value)} defaultValue="">
                  <option value="">-- Utiliser un modèle prédéfini --</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
              
              <input name="subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Objet (optionnel pour SMS/WhatsApp)" />
              <textarea name="body" value={body} onChange={e => setBody(e.target.value)} required placeholder="Votre message aux membres… (ex: Bonjour {{prenom}})" style={{ minHeight: "150px" }} />
              
              <p style={{ fontSize: "13px", color: "#6b7280" }}>
                💡 <b>Astuce :</b> Vous pouvez utiliser les variables <code>{`{{prenom}}`}</code> et <code>{`{{nom}}`}</code> pour personnaliser votre message.
              </p>

              <div className="member-picker" style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #d1d5db", borderRadius: "6px", padding: "8px", opacity: targetFilter !== "manual" ? 0.6 : 1, pointerEvents: targetFilter !== "manual" ? "none" : "auto" }}>
                {members.map(m => (
                  <label key={m.id} style={{ display: "block", marginBottom: "4px" }}>
                    <input type="checkbox" checked={ids.includes(m.id)} onChange={() => setIds(ids.includes(m.id) ? ids.filter(x => x !== m.id) : [...ids, m.id])} />
                    {m.first_name} {m.last_name} <small style={{ color: "#6b7280" }}>{m.email || m.phone || 'sans contact'}</small>
                  </label>
                ))}
              </div>
              
              <button disabled={busy || !ids.length} className="button button-dark">Envoyer à {ids.length} membre(s)</button>
            </form>

            <article className="panel channel-note">
              <p className="eyebrow">Aperçu du ciblage</p>
              <h2>{ids.length} destinataires</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                <p><b>Filtre actif :</b> {targetFilter === "all" ? "Tous les membres" : targetFilter === "debtors" ? "Membres en retard" : "Manuel"}</p>
                <p><b>Canaux :</b> Assurez-vous d'avoir les coordonnées correctes pour le canal choisi (Email / Tel).</p>
              </div>
            </article>
          </>
        )}
      </div>
    </div>
  );
}
