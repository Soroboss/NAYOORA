"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type DirectoryMember = { id: string; first_name: string; last_name: string; phone: string | null; email: string | null; member_number: string | null; status: string; office_role?: string | null; office_title?: string | null; photo_url?: string | null };

const roleLabel: Record<string, string> = {
  president: "Président",
  secretaire: "Secrétaire",
  tresorier: "Trésorier",
  vice_president: "Vice-président",
  commissaire: "Commissaire",
  member: "Membre",
};

export function MembersDirectory({ members: initialMembers, canManage }: { members: DirectoryMember[]; canManage: boolean }) {
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const filtered = useMemo(() => members.filter((member) => `${member.first_name} ${member.last_name} ${member.phone ?? ""} ${member.email ?? ""} ${member.member_number ?? ""} ${member.office_title ?? ""}`.toLowerCase().includes(query.toLowerCase())), [members, query]);

  async function remove(member: DirectoryMember) {
    if (!confirm(`Retirer ${member.first_name} ${member.last_name} du répertoire ?`)) return;
    const response = await fetch(`/api/members?id=${member.id}`, { method: "DELETE" });
    if (!response.ok) return setMessage("Suppression impossible.");
    setMembers(members.filter((item) => item.id !== member.id));
    setMessage("Membre retiré du répertoire.");
  }

  return <div className="members-workspace"><div className="directory-toolbar"><div><p className="eyebrow">{members.length} membre{members.length > 1 ? "s" : ""}</p><h2>Liste des membres</h2></div><div><input aria-label="Rechercher un membre" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher…" />{canManage && <Link className="button button-dark" href="/dashboard/members/new">+ Créer un membre</Link>}</div></div>{message && <p className="member-message">{message}</p>}<article className="panel directory"><div className="member-list">{filtered.map((member) => <div className="member-row member-row-wide" key={member.id}><span className="member-avatar">{member.photo_url ? <img src={member.photo_url} alt="" /> : `${member.first_name[0]}${member.last_name[0]}`}</span><div><b>{member.first_name} {member.last_name}</b><small>Matricule: {member.member_number || "Auto"} • {member.phone || member.email || "Aucun contact"}</small></div><span className={`member-status ${member.status}`}>{member.status === "active" ? "Actif" : member.status}</span><span className="member-office-chip">{roleLabel[member.office_role || "member"] ?? member.office_role}{member.office_title ? ` · ${member.office_title}` : ""}</span><div className="row-actions"><Link href={`/dashboard/members/${member.id}`} className="button" style={{padding: '6px 12px', background: '#e3edbd', color: '#16372b'}}>Modifier / Fiche</Link>{canManage && <button onClick={() => remove(member)}>Retirer</button>}</div></div>)}{!filtered.length && <div className="empty-state"><div>◎</div><h3>Aucun membre trouvé.</h3><p>Créez un membre ou ajustez votre recherche.</p></div>}</div></article></div>;
}
