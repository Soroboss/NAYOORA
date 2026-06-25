"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";

export type Member = { id: string; first_name: string; last_name: string; phone: string | null; email: string | null; member_number: string | null; status: string; birth_date: string | null; address: string | null; photo_url?: string | null };
type FormDataState = { firstName: string; lastName: string; phone: string; email: string; memberNumber: string; address: string; birthDate: string; photoUrl: string };
const blank: FormDataState = { firstName: "", lastName: "", phone: "", email: "", memberNumber: "", address: "", birthDate: "", photoUrl: "" };

export function MembersManager({ members: initialMembers, canManage }: { members: Member[]; canManage: boolean }) {
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<FormDataState>(blank);
  const [editing, setEditing] = useState<Member | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const filtered = useMemo(() => members.filter((member) => `${member.first_name} ${member.last_name} ${member.phone ?? ""} ${member.member_number ?? ""}`.toLowerCase().includes(query.toLowerCase())), [members, query]);
  const update = (event: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [event.target.name]: event.target.value });

  async function photo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 450_000) return setMessage("Photo trop lourde. Utilisez une image inférieure à 450 Ko pour cette version.");
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, photoUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/members", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { ...form, id: editing.id } : form),
    });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) return setMessage(body.error);
    setMembers(editing ? members.map((member) => member.id === editing.id ? body.member : member) : [body.member, ...members]);
    setForm(blank);
    setEditing(null);
    setMessage(editing ? "Membre mis à jour." : "Membre ajouté avec matricule automatique si non renseigné.");
  }

  function beginEdit(member: Member) {
    setEditing(member);
    setForm({ firstName: member.first_name, lastName: member.last_name, phone: member.phone ?? "", email: member.email ?? "", memberNumber: member.member_number ?? "", address: member.address ?? "", birthDate: member.birth_date ?? "", photoUrl: member.photo_url ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(member: Member) {
    if (!confirm(`Retirer ${member.first_name} ${member.last_name} du répertoire ?`)) return;
    const response = await fetch(`/api/members?id=${member.id}`, { method: "DELETE" });
    if (!response.ok) return setMessage("Suppression impossible.");
    setMembers(members.filter((item) => item.id !== member.id));
    setMessage("Membre retiré du répertoire.");
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage("");
    const payload = new FormData();
    payload.append("file", file);
    const response = await fetch("/api/members/import", { method: "POST", body: payload });
    const body = await response.json();
    setBusy(false);
    event.target.value = "";
    setMessage(response.ok ? `${body.imported} membre(s) importé(s), ${body.failed} ligne(s) à corriger. Actualisez la page pour voir la liste.` : body.error);
  }

  return <div className="members-workspace">{canManage && <div className="members-tools"><form className="member-form" onSubmit={save}><div className="panel-heading"><div><p className="eyebrow">{editing ? "Modification" : "Nouveau membre"}</p><h2>{editing ? "Mettre à jour" : "Ajouter au répertoire"}</h2></div>{editing && <button type="button" onClick={() => { setEditing(null); setForm(blank); }}>Annuler</button>}</div><div className="form-grid"><label>Prénom<input name="firstName" required value={form.firstName} onChange={update}/></label><label>Nom<input name="lastName" required value={form.lastName} onChange={update}/></label><label>Téléphone<input name="phone" value={form.phone} onChange={update}/></label><label>Email<input type="email" name="email" value={form.email} onChange={update}/></label><label>Matricule<input name="memberNumber" value={form.memberNumber} onChange={update} placeholder="Auto si vide"/></label><label>Date de naissance<input type="date" name="birthDate" value={form.birthDate} onChange={update}/></label><label>Photo<input type="file" accept="image/*" onChange={photo}/></label>{form.photoUrl && <span className="member-photo-preview"><img src={form.photoUrl} alt="" /> Photo prête</span>}</div><button disabled={busy} className="button button-dark">{busy ? "Enregistrement…" : editing ? "Enregistrer" : "Ajouter le membre"}</button></form><label className="csv-import"><span className="eyebrow">Import CSV</span><b>Importer un fichier</b><small>Colonnes : Prénom, Nom, Téléphone, Email, Matricule</small><input disabled={busy} type="file" accept=".csv,text/csv" onChange={importCsv}/></label></div>}{message && <p className="member-message">{message}</p>}<article className="panel directory"><div className="directory-heading"><div><p className="eyebrow">{members.length} membre{members.length > 1 ? "s" : ""}</p><h2>Répertoire</h2></div><input aria-label="Rechercher un membre" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher…" /></div>{filtered.length ? <div className="member-list">{filtered.map((member) => <div className="member-row" key={member.id}><span className="member-avatar">{member.photo_url ? <img src={member.photo_url} alt="" /> : `${member.first_name[0]}${member.last_name[0]}`}</span><div><b>{member.first_name} {member.last_name}</b><small>{member.member_number || member.phone || "Aucun contact"}</small></div><span className={`member-status ${member.status}`}>{member.status === "active" ? "Actif" : "Inactif"}</span>{canManage && <div className="row-actions"><button onClick={() => beginEdit(member)}>Modifier</button><button onClick={() => remove(member)}>Retirer</button></div>}</div>)}</div> : <div className="empty-state"><div>◎</div><h3>Aucun membre trouvé.</h3><p>Ajoutez une personne ou importez votre premier fichier CSV.</p></div>}</article></div>;
}
