"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/insforge/client";
import { toast } from "sonner";

export type Member = { id: string; first_name: string; last_name: string; phone: string | null; email: string | null; member_number: string | null; status: string; birth_date: string | null; address: string | null; photo_url?: string | null; title?: string | null; reports_to?: string | null };
type FormDataState = { firstName: string; lastName: string; phone: string; email: string; memberNumber: string; address: string; birthDate: string; photoUrl: string; title: string; reportsTo: string };
const blank: FormDataState = { firstName: "", lastName: "", phone: "", email: "", memberNumber: "", address: "", birthDate: "", photoUrl: "", title: "", reportsTo: "" };

export function MembersManager({ organizationId, members: initialMembers, canManage }: { organizationId: string; members: Member[]; canManage: boolean }) {
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<FormDataState>(blank);
  const [editing, setEditing] = useState<Member | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const filtered = useMemo(() => members.filter((member) => `${member.first_name} ${member.last_name} ${member.phone ?? ""} ${member.member_number ?? ""}`.toLowerCase().includes(query.toLowerCase())), [members, query]);
  const update = (event: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [event.target.name]: event.target.value });

  const [activeTab, setActiveTab] = useState("repertoire");

  async function photo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Le fichier choisi doit être une image.");
      return setMessage("Le fichier choisi doit être une image.");
    }
    if (file.size > 2_000_000) {
      toast.error("Photo trop lourde (max 2 Mo).");
      return setMessage("Photo trop lourde. Utilisez une image inférieure à 2 Mo.");
    }
    setBusy(true);
    setMessage("Upload de la photo en cours…");
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `organizations/${organizationId}/members/${crypto.randomUUID()}-${safeName}`;
      const bucket = createClient().storage.from("member-photos");
      const { data, error } = await bucket.upload(path, file);
      if (error) throw error;
      const publicUrl = data?.url ?? bucket.getPublicUrl(path).data?.publicUrl ?? path;
      setForm((current) => ({ ...current, photoUrl: publicUrl }));
      toast.success("Photo uploadée avec succès.");
      setMessage("Photo uploadée. Enregistrez le membre pour l’associer à sa fiche.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Upload de la photo impossible.";
      toast.error(msg);
      setMessage(msg);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
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
    if (!response.ok) {
      toast.error(body.error || "Erreur d'enregistrement.");
      return setMessage(body.error);
    }
    setMembers(editing ? members.map((member) => member.id === editing.id ? body.member : member) : [body.member, ...members]);
    setForm(blank);
    setEditing(null);
    toast.success(editing ? "Membre mis à jour avec succès." : "Membre ajouté avec succès.");
    setMessage(editing ? "Membre mis à jour." : "Membre ajouté avec matricule automatique si non renseigné.");
    setActiveTab("repertoire");
  }

  function beginEdit(member: Member) {
    setEditing(member);
    setForm({ firstName: member.first_name, lastName: member.last_name, phone: member.phone ?? "", email: member.email ?? "", memberNumber: member.member_number ?? "", address: member.address ?? "", birthDate: member.birth_date ?? "", photoUrl: member.photo_url ?? "", title: member.title ?? "", reportsTo: member.reports_to ?? "" });
    setActiveTab("ajouter");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(member: Member) {
    if (!confirm(`Retirer ${member.first_name} ${member.last_name} du répertoire ?`)) return;
    const response = await fetch(`/api/members?id=${member.id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Suppression impossible.");
      return setMessage("Suppression impossible.");
    }
    setMembers(members.filter((item) => item.id !== member.id));
    toast.success("Membre retiré du répertoire.");
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
    if (response.ok) {
      toast.success(`${body.imported} membre(s) importé(s)`);
      if (body.failed > 0) toast.warning(`${body.failed} ligne(s) à corriger.`);
      setMessage(`${body.imported} membre(s) importé(s), ${body.failed} ligne(s) à corriger. Actualisez la page pour voir la liste.`);
      setActiveTab("repertoire");
    } else {
      toast.error(body.error || "Erreur d'importation.");
      setMessage(body.error);
    }
  }

  return (
    <div className="finance-workspace">
      
      <div className="finance-stats">
        <article>
          <p>Total Membres</p>
          <strong>{members.length}</strong>
        </article>
        <article>
          <p>Membres Actifs</p>
          <strong>{members.filter(m => m.status === 'active').length}</strong>
        </article>
        <article>
          <p>Dernier Ajout</p>
          <strong>{members.length > 0 ? members[0].first_name : 'N/A'}</strong>
        </article>
      </div>

      <div className="tabs" style={{ display: "flex", gap: "16px", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
        <button onClick={() => {setActiveTab("repertoire"); setEditing(null); setForm(blank);}} style={{ padding: "12px 16px", borderBottom: activeTab === "repertoire" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "repertoire" ? "bold" : "normal" }}>Répertoire</button>
        {canManage && <button onClick={() => setActiveTab("ajouter")} style={{ padding: "12px 16px", borderBottom: activeTab === "ajouter" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "ajouter" ? "bold" : "normal" }}>{editing ? 'Modifier le membre' : 'Ajouter / Importer'}</button>}
      </div>

      {message && <p className="member-message">{message}</p>}

      <div style={{ display: "grid", gridTemplateColumns: canManage && activeTab === "ajouter" ? "2fr 1fr" : "1fr", gap: "24px", alignItems: "start" }}>
        
        {activeTab === "repertoire" && (
          <article className="panel directory" style={{ maxWidth: "100%" }}>
            <div className="directory-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="eyebrow">{members.length} membre{members.length > 1 ? "s" : ""}</p>
                <h2>Répertoire</h2>
              </div>
              <input aria-label="Rechercher un membre" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher…" style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
            </div>
            
            <div style={{ maxHeight: "600px", overflowY: "auto", marginTop: "16px" }}>
              {filtered.length ? (
                <div className="member-list">
                  {filtered.map((member) => (
                    <div className="member-row" key={member.id}>
                      <span className="member-avatar">
                        {member.photo_url ? <img src={member.photo_url} alt="" /> : `${member.first_name[0]}${member.last_name[0]}`}
                      </span>
                      <div>
                        <b>{member.first_name} {member.last_name}</b>
                        <small>{member.title || "Membre"}</small>
                      </div>
                      <span className={`member-status ${member.status}`}>{member.status === "active" ? "Actif" : "Inactif"}</span>
                      {canManage && (
                        <div className="row-actions">
                          <button onClick={() => beginEdit(member)}>Modifier</button>
                          <button onClick={() => remove(member)}>Retirer</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div>◎</div>
                  <h3>Aucun membre trouvé.</h3>
                  <p>Ajoutez une personne ou importez votre premier fichier CSV.</p>
                </div>
              )}
            </div>
          </article>
        )}

        {activeTab === "ajouter" && canManage && (
          <>
            <form className="panel compact-form" onSubmit={save}>
              <div className="panel-heading" style={{ marginBottom: "16px" }}>
                <div>
                  <p className="eyebrow">{editing ? "Modification" : "Nouveau membre"}</p>
                  <h2>{editing ? "Mettre à jour" : "Ajouter au répertoire"}</h2>
                </div>
                {editing && <button type="button" onClick={() => { setEditing(null); setForm(blank); setActiveTab("repertoire"); }} style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: "4px", background: "#fff", cursor: "pointer" }}>Annuler</button>}
              </div>
              
              <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <label>Prénom<input name="firstName" required value={form.firstName} onChange={update}/></label>
                <label>Nom<input name="lastName" required value={form.lastName} onChange={update}/></label>
                <label>Téléphone<input name="phone" value={form.phone} onChange={update}/></label>
                <label>Email<input type="email" name="email" value={form.email} onChange={update}/></label>
                <label>Matricule<input name="memberNumber" value={form.memberNumber} onChange={update} placeholder="Auto si vide"/></label>
                <label>Date de naissance<input type="date" name="birthDate" value={form.birthDate} onChange={update}/></label>
                <label>Fonction<input name="title" value={form.title} onChange={update} placeholder="Ex: Président"/></label>
                <label>Supérieur hiérarchique
                  <select name="reportsTo" value={form.reportsTo} onChange={update as any}>
                    <option value="">Aucun</option>
                    {members.filter(m => m.id !== editing?.id).map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name} ({m.title || 'Membre'})</option>)}
                  </select>
                </label>
                <label style={{ gridColumn: "1 / -1" }}>Photo du membre<input disabled={busy} type="file" accept="image/*" onChange={photo}/><small>Image uploadée dans InsForge Storage, 2 Mo max.</small></label>
                {form.photoUrl && <span className="member-photo-preview" style={{ gridColumn: "1 / -1" }}><img src={form.photoUrl} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%" }} /> Photo uploadée</span>}
              </div>
              
              <button disabled={busy} className="button button-dark" style={{ marginTop: "16px", width: "100%" }}>{busy ? "Traitement…" : editing ? "Enregistrer" : "Ajouter le membre"}</button>
            </form>

            <article className="panel channel-note">
              <p className="eyebrow">Import en masse</p>
              <h2>Importer un CSV</h2>
              <p>Colonnes requises : Prénom, Nom, Téléphone, Email, Matricule</p>
              <label style={{ display: "block", marginTop: "16px", padding: "16px", border: "1px dashed #d1d5db", borderRadius: "8px", textAlign: "center", cursor: "pointer", background: "#f9fafb" }}>
                <b>Choisir un fichier .csv</b>
                <input disabled={busy} type="file" accept=".csv,text/csv" onChange={importCsv} style={{ display: "none" }} />
              </label>
            </article>
          </>
        )}
      </div>
    </div>
  );
}
