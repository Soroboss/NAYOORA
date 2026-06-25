"use client";

import { FormEvent, useState } from "react";

const roles = [
  ["organization_admin", "Administrateur organisation"],
  ["president", "Président / Responsable"],
  ["secretaire", "Secrétaire"],
  ["tresorier", "Trésorier"],
  ["gestionnaire", "Gestionnaire"],
  ["membre", "Membre simple"],
] as const;

const accessLevels = [
  ["viewer", "Lecture seule"],
  ["standard", "Standard"],
  ["finance", "Finance"],
  ["operations", "Opérations"],
  ["admin", "Administration"],
  ["owner", "Propriétaire tenant"],
] as const;

const roleLabel = (role: string) => roles.find(([value]) => value === role)?.[1] ?? role;
const accessLabel = (level: string) => accessLevels.find(([value]) => value === level)?.[1] ?? level;

async function send(payload: object) {
  const response = await fetch("/api/administration", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error);
  return data;
}

export function AdministrationManager({
  organization,
  members,
  cards,
  users,
  invites,
  canManage,
}: {
  organization: any;
  members: any[];
  cards: any[];
  users: any[];
  invites: any[];
  canManage: boolean;
}) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault();
    setBusy(true);
    try {
      await send({ action, ...Object.fromEntries(new FormData(event.currentTarget)) });
      setNotice(action === "invite" ? "Collaborateur invité. Copiez le lien dans la liste des invitations si besoin." : "Mise à jour enregistrée.");
      if (action !== "role") event.currentTarget.reset();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function inviteUrl(token: string) {
    if (typeof window === "undefined") return `/invite/${token}`;
    return `${window.location.origin}/invite/${token}`;
  }

  return (
    <div className="finance-workspace">
      {canManage && (
        <div className="finance-forms">
          <form className="panel compact-form" onSubmit={(event) => submit(event, "invite")}>
            <p className="eyebrow">Collaborateurs</p>
            <h2>Créer un accès</h2>
            <input required name="email" type="email" placeholder="email@organisation.org" />
            <select name="role" defaultValue="gestionnaire">
              {roles.slice(1).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select name="accessLevel" defaultValue="standard">
              {accessLevels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <input name="responsibility" placeholder="Responsabilité, ex. Caisse, Membres, Communication" />
            <small>Le lien d’invitation permet au collaborateur de créer ou connecter son compte.</small>
            <button disabled={busy} className="button button-dark">Créer l’invitation</button>
          </form>

          <form className="panel compact-form" onSubmit={(event) => submit(event, "card")}>
            <p className="eyebrow">Cartes de membre</p>
            <h2>Émettre une carte</h2>
            <select name="memberId" required>
              <option value="">Choisir un membre</option>
              {members.map((member) => <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>)}
            </select>
            <input name="prefix" placeholder="Préfixe, ex. MUT" />
            <button disabled={busy} className="button button-dark">Générer la carte</button>
          </form>

          <form className="panel compact-form" onSubmit={(event) => submit(event, "settings")}>
            <p className="eyebrow">Paramètres</p>
            <h2>Organisation</h2>
            <input required name="name" defaultValue={organization?.name} />
            <input name="phone" defaultValue={organization?.phone || ""} placeholder="Téléphone" />
            <input name="email" defaultValue={organization?.email || ""} placeholder="Email" />
            <input name="country" defaultValue={organization?.country_code || "CI"} placeholder="Pays (CI)" />
            <input name="currency" defaultValue={organization?.currency || "XOF"} placeholder="Devise" />
            <input name="timezone" defaultValue="Africa/Abidjan" />
            <button disabled={busy} className="button button-dark">Enregistrer</button>
          </form>
        </div>
      )}

      {notice && <p className="member-message">{notice}</p>}

      <div className="finance-lists">
        <article className="panel">
          <p className="eyebrow">Accès</p>
          <h2>Collaborateurs actifs</h2>
          <div className="finance-list">
            {users.map((user) => (
              <div key={user.id}>
                <span>
                  <b>{user.user_id.slice(0, 8)}…</b>
                  <small>{roleLabel(user.role)} · {accessLabel(user.access_level || "standard")} · {user.responsibility || "Responsabilité non précisée"}</small>
                </span>
                {canManage ? (
                  <form onSubmit={(event) => submit(event, "role")} className="inline-access-form">
                    <input type="hidden" name="membershipId" value={user.id} />
                    <select name="role" defaultValue={user.role}>{roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                    <select name="accessLevel" defaultValue={user.access_level || "standard"}>{accessLevels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                    <input name="responsibility" defaultValue={user.responsibility || ""} placeholder="Responsabilité" />
                    <button disabled={busy}>Mettre à jour</button>
                  </form>
                ) : <b>{roleLabel(user.role)}</b>}
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Invitations</p>
          <h2>Collaborateurs invités</h2>
          <div className="finance-list">
            {invites.map((invite) => (
              <div key={invite.id}>
                <span>
                  <b>{invite.email}</b>
                  <small>{roleLabel(invite.role)} · {accessLabel(invite.access_level || "standard")} · {invite.responsibility || "Responsabilité non précisée"}</small>
                </span>
                {invite.status === "pending" && invite.token ? <a href={inviteUrl(invite.token)} target="_blank">Lien</a> : <b>{invite.status}</b>}
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="finance-lists">
        <article className="panel">
          <p className="eyebrow">Cartes</p>
          <h2>Cartes émises</h2>
          <div className="finance-list">
            {cards.map((card) => <div key={card.id}><span><b>{card.member?.first_name} {card.member?.last_name}</b><small>{card.card_number}</small></span><b>{card.status}</b></div>)}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Matrice d’accès</p>
          <h2>Niveaux disponibles</h2>
          <div className="finance-list">
            {accessLevels.map(([value, label]) => <div key={value}><span><b>{label}</b><small>{value}</small></span></div>)}
          </div>
        </article>
      </div>
    </div>
  );
}
