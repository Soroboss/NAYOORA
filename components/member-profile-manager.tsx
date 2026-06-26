"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const officeRoles = [
  ["member", "Membre"],
  ["president", "Président"],
  ["vice_president", "Vice-président"],
  ["secretaire", "Secrétaire"],
  ["tresorier", "Trésorier"],
  ["commissaire", "Commissaire"],
] as const;

const roleLabel = (role: string) => officeRoles.find(([value]) => value === role)?.[1] ?? role;

export function MemberProfileManager({ member, elections, canManage }: { member: any; elections: any[]; canManage: boolean }) {
  const router = useRouter();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/members", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "office", id: member.id, ...payload }) });
    const data = await response.json();
    setBusy(false);
    setNotice(response.ok ? "Profil mis à jour." : data.error);
    if (response.ok) router.refresh();
  }

  async function submitElection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/elections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, memberId: member.id }) });
    const data = await response.json();
    setBusy(false);
    setNotice(response.ok ? "Élection enregistrée et fonction activée." : data.error);
    if (response.ok) router.refresh();
  }

  async function submitEditProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    // photoUrl might be present if uploaded
    if (form.photoUrl) payload.photoUrl = form.photoUrl;

    const response = await fetch("/api/members", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: member.id, ...payload }) });
    const data = await response.json();
    setBusy(false);
    setNotice(response.ok ? "Profil mis à jour." : data.error);
    if (response.ok) router.refresh();
  }

  const [form, setForm] = useState<any>({});
  async function photo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setNotice("Le fichier choisi doit être une image.");
    if (file.size > 2_000_000) return setNotice("Photo trop lourde. Utilisez une image inférieure à 2 Mo.");
    setBusy(true);
    setNotice("Upload de la photo en cours…");
    try {
      // using dynamic import to avoid layout shift issues or requiring global createClient
      const { createClient } = await import("@/lib/insforge/client");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `organizations/${member.organization_id}/members/${crypto.randomUUID()}-${safeName}`;
      const bucket = createClient().storage.from("member-photos");
      const { data, error } = await bucket.upload(path, file);
      if (error) throw error;
      const publicUrl = data?.url ?? bucket.getPublicUrl(path).data?.publicUrl ?? path;
      setForm((current: any) => ({ ...current, photoUrl: publicUrl }));
      setNotice("Photo uploadée. Enregistrez le profil pour valider.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Upload impossible.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return <div className="member-profile-grid"><article className="panel member-profile-card"><div className="profile-photo">{member.photo_url ? <img src={member.photo_url} alt="" /> : `${member.first_name?.[0] ?? ""}${member.last_name?.[0] ?? ""}`}</div><p className="eyebrow">Fiche membre</p><h2>{member.first_name} {member.last_name}</h2><div className="profile-lines"><p><b>Matricule</b><span>{member.member_number || "Auto non défini"}</span></p><p><b>Téléphone</b><span>{member.phone || "Non renseigné"}</span></p><p><b>Email</b><span>{member.email || "Non renseigné"}</span></p><p><b>Adresse</b><span>{member.address || "Non renseignée"}</span></p><p><b>Statut</b><span>{member.status}</span></p><p><b>Fonction</b><span>{roleLabel(member.office_role || "member")}{member.office_title ? ` · ${member.office_title}` : ""}</span></p></div></article><div className="member-profile-actions">{canManage && <form className="panel compact-form" onSubmit={submitEditProfile}><p className="eyebrow">Coordonnées</p><h2>Modifier le profil</h2><input name="firstName" required defaultValue={member.first_name} placeholder="Prénom" /><input name="lastName" required defaultValue={member.last_name} placeholder="Nom" /><input name="phone" defaultValue={member.phone || ""} placeholder="Téléphone" /><input name="email" type="email" defaultValue={member.email || ""} placeholder="Email" /><input name="address" defaultValue={member.address || ""} placeholder="Adresse" />
    <label>Photo<input disabled={busy} type="file" accept="image/*" onChange={photo}/></label>
    {form.photoUrl && <span className="member-photo-preview"><img src={form.photoUrl} alt="" /> Nouvelle photo en attente</span>}
    <button disabled={busy} className="button button-dark">Enregistrer les infos</button></form>}
    {canManage && <form className="panel compact-form" onSubmit={submitProfile}><p className="eyebrow">Statut & fonction</p><h2>Mettre à jour</h2><select name="status" defaultValue={member.status}><option value="active">Membre actif</option><option value="inactive">Inactif</option><option value="suspended">Suspendu</option></select><select name="officeRole" defaultValue={member.office_role || "member"}>{officeRoles.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><input name="officeTitle" defaultValue={member.office_title || ""} placeholder="Titre affiché, ex. Président du bureau" /><input name="roleStartedOn" defaultValue={member.role_started_on || ""} type="date" /><input name="electedUntil" defaultValue={member.elected_until || ""} type="date" /><button disabled={busy} className="button button-dark">Changer le statut</button></form>}{canManage && <form className="panel compact-form" onSubmit={submitElection}><p className="eyebrow">Élection</p><h2>Activer après élection</h2><input required name="title" placeholder="Ex. Élection bureau 2026" /><select name="position" defaultValue={member.office_role || "president"}>{officeRoles.filter(([value]) => value !== "member").map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><input name="electionDate" type="date" /><input name="effectiveOn" type="date" /><input name="notes" placeholder="Notes / PV / contexte" /><button disabled={busy} className="button button-dark">Enregistrer l’élection</button></form>}{notice && <p className="member-message">{notice}</p>}<article className="panel"><p className="eyebrow">Historique</p><h2>Élections & nominations</h2><div className="finance-list">{elections.map((election) => <div key={election.id}><span><b>{election.title}</b><small>{roleLabel(election.position)} · {election.election_date ? new Date(election.election_date).toLocaleDateString("fr-FR") : "Date non précisée"}</small></span><b>{election.status}</b></div>)}{!elections.length && <div><span><b>Aucune élection enregistrée</b><small>Utilisez le formulaire pour créer le premier historique.</small></span></div>}</div></article></div></div>;
}
