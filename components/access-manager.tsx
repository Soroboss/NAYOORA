"use client";
import { useState } from "react";

export function AccessManager({ memberships, profiles, invites, logs, canManage }: { memberships: any[]; profiles: any[]; invites: any[]; logs: any[]; canManage: boolean }) {
  const [notice, setNotice] = useState("");
  async function link(memberId: string, membershipId: string) {
    const response = await fetch("/api/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "link_member", memberId, membershipId }) });
    const data = await response.json();
    setNotice(response.ok ? "Compte lié. Actualisez la page." : data.error);
  }
  return <div className="finance-workspace">
    {notice && <p className="member-message">{notice}</p>}
    <div className="finance-lists"><article className="panel"><p className="eyebrow">1 · Invitations</p><h2>Invitations actives</h2><div className="finance-list">{invites.map((invite) => <div key={invite.id}><span><b>{invite.email}</b><small>{invite.role} · expire le {new Date(invite.expires_at).toLocaleDateString("fr-FR")}</small></span><a href={`/invite/${invite.token}`} target="_blank">Lien</a></div>)}</div></article><article className="panel"><p className="eyebrow">2 · Rôles</p><h2>Équipe</h2><div className="finance-list">{memberships.map((member) => <div key={member.id}><span><b>{member.user_id.slice(0, 8)}…</b><small>{member.status}</small></span><b>{member.role}</b></div>)}</div></article></div>
    {canManage && <article className="panel"><p className="eyebrow">3 · Liaison compte–membre</p><h2>Portail membre</h2><div className="finance-list">{profiles.filter((profile) => !profile.organization_member_id).map((profile) => <div key={profile.id}><span><b>{profile.first_name} {profile.last_name}</b><small>Compte non relié</small></span><select onChange={(event) => event.target.value && link(profile.id, event.target.value)} defaultValue=""><option value="">Relier à un utilisateur</option>{memberships.map((member) => <option key={member.id} value={member.id}>{member.user_id.slice(0, 8)}…</option>)}</select></div>)}</div></article>}
    <article className="panel"><p className="eyebrow">4–5 · Journal d’accès</p><h2>Actions récentes</h2><div className="finance-list">{logs.map((log) => <div key={log.id}><span><b>{log.event_type}</b><small>{new Date(log.created_at).toLocaleString("fr-FR")}</small></span></div>)}</div></article>
  </div>;
}
