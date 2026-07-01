"use client";
import { FormEvent, useMemo, useState } from 'react';

async function send(x: object) {
  const r = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(x) });
  const d = await r.json();
  if (!r.ok) throw Error(d.error);
  return d;
}

export function EventsManager({ members, events, attendance, canManage }: { members: any[]; events: any[]; attendance: any[]; canManage: boolean }) {
  const [n, setN] = useState('');
  const [busy, setBusy] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("calendrier");

  const counts = useMemo(() => Object.fromEntries(events.map(e => [e.id, attendance.filter(a => a.event_id === e.id && a.status === 'attended').length])), [events, attendance]);

  async function sub(e: FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    setBusy(true);
    try {
      const d = Object.fromEntries(new FormData(e.currentTarget));
      if (action === 'invite') Object.assign(d, { memberIds: chosen });
      await send({ action, ...d });
      setN(action === 'invite' ? 'Convocations enregistrées.' : 'Opération enregistrée. Actualisez la page pour actualiser la liste.');
      ((e.target || e.currentTarget) as HTMLFormElement | null)?.reset();
      if (action === 'invite') setChosen([]);
      setActiveTab("calendrier");
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
          <p>Événements</p>
          <strong>{events.length}</strong>
        </article>
        <article>
          <p>À venir</p>
          <strong>{events.filter(e => new Date(e.starts_at) > new Date()).length}</strong>
        </article>
        <article>
          <p>Présences enregistrées</p>
          <strong>{attendance.filter(a => a.status === 'attended').length}</strong>
        </article>
      </div>

      <div className="tabs" style={{ display: "flex", gap: "16px", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
        <button onClick={() => setActiveTab("calendrier")} style={{ padding: "12px 16px", borderBottom: activeTab === "calendrier" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "calendrier" ? "bold" : "normal" }}>Calendrier</button>
        {canManage && <button onClick={() => setActiveTab("planifier")} style={{ padding: "12px 16px", borderBottom: activeTab === "planifier" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "planifier" ? "bold" : "normal" }}>Planifier & Gérer</button>}
      </div>

      {n && <p className="member-message">{n}</p>}

      <div className="module-split" style={{ display: "grid", gridTemplateColumns: canManage && activeTab === "planifier" ? "2fr 1fr" : "1fr", gap: "24px", alignItems: "start" }}>
        
        {activeTab === "calendrier" && (
          <article className="panel">
            <p className="eyebrow">Calendrier</p>
            <h2>Événements récents</h2>
            <div className="finance-list" style={{ maxHeight: "600px", overflowY: "auto" }}>
              {events.length === 0 ? <p className="muted">Aucun événement planifié.</p> : events.map(e => (
                <div key={e.id}>
                  <span>
                    <b>{e.title}</b>
                    <small>{new Date(e.starts_at).toLocaleString('fr-FR')} · {e.location || 'Lieu à confirmer'}</small>
                  </span>
                  <b>{counts[e.id] || 0} présent(s)</b>
                </div>
              ))}
            </div>
          </article>
        )}

        {activeTab === "planifier" && canManage && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <form className="panel compact-form" onSubmit={e => sub(e, 'event')}>
                <p className="eyebrow">Événements</p>
                <h2>Planifier</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                  <input required name="title" placeholder="Ex. Assemblée générale" style={{ gridColumn: "1 / -1" }} />
                  <input name="location" placeholder="Lieu" style={{ gridColumn: "1 / -1" }} />
                  <label>
                    <small style={{ display: "block", marginBottom: "4px", color: "#6b7280" }}>Début</small>
                    <input required name="startsAt" type="datetime-local" style={{ width: "100%" }} />
                  </label>
                  <label>
                    <small style={{ display: "block", marginBottom: "4px", color: "#6b7280" }}>Fin</small>
                    <input name="endsAt" type="datetime-local" style={{ width: "100%" }} />
                  </label>
                </div>
                <button disabled={busy} className="button button-dark" style={{ marginTop: "16px" }}>Créer l'événement</button>
              </form>

              <form className="panel compact-form" onSubmit={e => sub(e, 'invite')}>
                <p className="eyebrow">Convocations</p>
                <h2>Inviter les membres</h2>
                <select name="eventId" required style={{ width: "100%", marginBottom: "16px", padding: "8px", borderRadius: "6px" }}>
                  <option value="">Choisir un événement</option>
                  {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
                <div className="member-picker" style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #d1d5db", borderRadius: "6px", padding: "8px" }}>
                  {members.map(m => (
                    <label key={m.id} style={{ display: "block", marginBottom: "4px" }}>
                      <input type="checkbox" checked={chosen.includes(m.id)} onChange={() => setChosen(chosen.includes(m.id) ? chosen.filter(x => x !== m.id) : [...chosen, m.id])} />
                      {m.first_name} {m.last_name}
                    </label>
                  ))}
                </div>
                <button disabled={busy || !chosen.length} className="button button-dark" style={{ marginTop: "16px" }}>Convoquer ({chosen.length})</button>
              </form>
            </div>

            <form className="panel compact-form" onSubmit={e => sub(e, 'attendance')}>
              <p className="eyebrow">Présences</p>
              <h2>Pointer un membre</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                <select name="eventId" required style={{ width: "100%", padding: "8px", borderRadius: "6px" }}>
                  <option value="">Choisir un événement</option>
                  {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
                <select name="memberId" required style={{ width: "100%", padding: "8px", borderRadius: "6px" }}>
                  <option value="">Choisir un membre</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                </select>
                <select name="status" style={{ width: "100%", padding: "8px", borderRadius: "6px" }}>
                  <option value="attended">Présent</option>
                  <option value="absent">Absent</option>
                  <option value="excused">Excusé</option>
                </select>
                <button disabled={busy} className="button button-dark" style={{ marginTop: "8px" }}>Enregistrer la présence</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
