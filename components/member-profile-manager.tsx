"use client";

import { FormEvent, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { MemberCard } from "./member-card";

const officeRoles = [
  ["member", "Membre"],
  ["president", "Président"],
  ["vice_president", "Vice-président"],
  ["secretaire", "Secrétaire"],
  ["tresorier", "Trésorier"],
  ["commissaire", "Commissaire"],
] as const;

const roleLabel = (role: string) => officeRoles.find(([value]) => value === role)?.[1] ?? role;

export function MemberProfileManager({ member, elections, canManage, orgName }: { member: any; elections: any[]; canManage: boolean; orgName?: string }) {
  const router = useRouter();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<any>({});
  
  // Modals state
  const [activeModal, setActiveModal] = useState<"none" | "editProfile" | "editStatus" | "addElection" | "memberCard">("none");

  function closeModal() {
    setActiveModal("none");
    setNotice("");
    setForm({});
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/members", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "office", id: member.id, ...payload }) });
    const data = await response.json();
    setBusy(false);
    if (response.ok) {
      closeModal();
      router.refresh();
    } else {
      setNotice(data.error);
    }
  }

  async function submitElection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/elections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, memberId: member.id }) });
    const data = await response.json();
    setBusy(false);
    if (response.ok) {
      closeModal();
      router.refresh();
    } else {
      setNotice(data.error);
    }
  }

  async function submitEditProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    if (form.photoUrl) payload.photoUrl = form.photoUrl;

    const response = await fetch("/api/members", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: member.id, ...payload }) });
    const data = await response.json();
    setBusy(false);
    if (response.ok) {
      closeModal();
      router.refresh();
    } else {
      setNotice(data.error);
    }
  }

  async function photo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setNotice("Le fichier choisi doit être une image.");
    if (file.size > 2_000_000) return setNotice("Photo trop lourde. Utilisez une image inférieure à 2 Mo.");
    setBusy(true);
    setNotice("Upload de la photo en cours…");
    try {
      const { createClient } = await import("@/lib/insforge/client");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `organizations/${member.organization_id}/members/${crypto.randomUUID()}-${safeName}`;
      const client = createClient();
      if (!client) throw new Error("Client non configuré (Clés API manquantes).");
      const bucket = client.storage.from("member-photos");
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

  return (
    <div>
      {/* Top Action Bar */}
      {canManage && (
        <div className="member-top-actions">
          <button className="button" onClick={() => setActiveModal("editProfile")}>✏️ Modifier profil</button>
          <button className="button" onClick={() => setActiveModal("editStatus")}>⚙️ Gérer statut</button>
          <button className="button" onClick={() => setActiveModal("addElection")}>🗳️ Ajouter élection</button>
          <button className="button button-dark" onClick={() => setActiveModal("memberCard")}>🪪 Générer la carte</button>
        </div>
      )}

      {/* Main Profile View */}
      <div className="member-profile-grid">
        <article className="panel member-profile-card">
          <div className="profile-photo">
            {member.photo_url ? (
              <img src={member.photo_url} alt="Photo" crossOrigin="anonymous" />
            ) : (
              `${member.first_name?.[0] ?? ""}${member.last_name?.[0] ?? ""}`
            )}
          </div>
          <p className="eyebrow">Fiche membre</p>
          <h2>{member.first_name} {member.last_name}</h2>
          <div className="profile-lines">
            <p><b>Matricule</b><span>{member.member_number || "Auto non défini"}</span></p>
            <p><b>Téléphone</b><span>{member.phone || "Non renseigné"}</span></p>
            <p><b>Email</b><span>{member.email || "Non renseigné"}</span></p>
            <p><b>Adresse</b><span>{member.address || "Non renseignée"}</span></p>
            <p><b>Statut</b><span>{member.status}</span></p>
            <p><b>Fonction</b><span>{roleLabel(member.office_role || "member")}{member.office_title ? ` · ${member.office_title}` : ""}</span></p>
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Historique</p>
          <h2>Élections & nominations</h2>
          <div className="finance-list">
            {elections.map((election) => (
              <div key={election.id}>
                <span>
                  <b>{election.title}</b>
                  <small>{roleLabel(election.position)} · {election.election_date ? new Date(election.election_date).toLocaleDateString("fr-FR") : "Date non précisée"}</small>
                </span>
                <b>{election.status}</b>
              </div>
            ))}
            {!elections.length && (
              <div>
                <span>
                  <b>Aucune élection enregistrée</b>
                  <small>Utilisez "Ajouter élection" pour créer le premier historique.</small>
                </span>
              </div>
            )}
          </div>
        </article>
      </div>

      {/* Modals Overlay */}
      {activeModal !== "none" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            
            {activeModal === "editProfile" && (
              <form className="compact-form" onSubmit={submitEditProfile}>
                <p className="eyebrow">Coordonnées</p>
                <h2>Modifier le profil</h2>
                <input name="firstName" required defaultValue={member.first_name} placeholder="Prénom" />
                <input name="lastName" required defaultValue={member.last_name} placeholder="Nom" />
                <input name="phone" defaultValue={member.phone || ""} placeholder="Téléphone" />
                <input name="email" type="email" defaultValue={member.email || ""} placeholder="Email" />
                <input name="address" defaultValue={member.address || ""} placeholder="Adresse" />
                <label>Photo<input disabled={busy} type="file" accept="image/*" onChange={photo}/></label>
                {form.photoUrl && <span className="member-photo-preview"><img src={form.photoUrl} alt="" /> Nouvelle photo en attente</span>}
                {notice && <p className="member-message">{notice}</p>}
                <button disabled={busy} className="button button-dark">Enregistrer les infos</button>
              </form>
            )}

            {activeModal === "editStatus" && (
              <form className="compact-form" onSubmit={submitProfile}>
                <p className="eyebrow">Statut & fonction</p>
                <h2>Mettre à jour</h2>
                <select name="status" defaultValue={member.status}>
                  <option value="active">Membre actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="suspended">Suspendu</option>
                </select>
                <select name="officeRole" defaultValue={member.office_role || "member"}>
                  {officeRoles.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
                <input name="officeTitle" defaultValue={member.office_title || ""} placeholder="Titre affiché, ex. Président du bureau" />
                <input name="roleStartedOn" defaultValue={member.role_started_on || ""} type="date" />
                <input name="electedUntil" defaultValue={member.elected_until || ""} type="date" />
                {notice && <p className="member-message">{notice}</p>}
                <button disabled={busy} className="button button-dark">Changer le statut</button>
              </form>
            )}

            {activeModal === "addElection" && (
              <form className="compact-form" onSubmit={submitElection}>
                <p className="eyebrow">Élection</p>
                <h2>Activer après élection</h2>
                <input required name="title" placeholder="Ex. Élection bureau 2026" />
                <select name="position" defaultValue={member.office_role || "president"}>
                  {officeRoles.filter(([value]) => value !== "member").map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
                <input name="electionDate" type="date" />
                <input name="effectiveOn" type="date" />
                <input name="notes" placeholder="Notes / PV / contexte" />
                {notice && <p className="member-message">{notice}</p>}
                <button disabled={busy} className="button button-dark">Enregistrer l’élection</button>
              </form>
            )}

            {activeModal === "memberCard" && (
              <div className="compact-form">
                <p className="eyebrow">Aperçu</p>
                <h2>Carte de Membre</h2>
                <MemberCard member={member} orgName={orgName || "Organisation"} />
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .member-top-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          position: relative;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #64748b;
        }
        .modal-close:hover {
          color: #0f172a;
        }
      `}</style>
    </div>
  );
}
