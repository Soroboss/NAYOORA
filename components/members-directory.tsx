"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useMemo, useState, useRef } from "react";
import { WhatsAppButton } from "@/components/whatsapp-button";
import * as XLSX from "xlsx";

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
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => members.filter((member) => `${member.first_name} ${member.last_name} ${member.phone ?? ""} ${member.email ?? ""} ${member.member_number ?? ""} ${member.office_title ?? ""}`.toLowerCase().includes(query.toLowerCase())), [members, query]);

  async function remove(member: DirectoryMember) {
    if (!confirm(`Retirer ${member.first_name} ${member.last_name} du répertoire ?`)) return;
    const response = await fetch(`/api/members?id=${member.id}`, { method: "DELETE" });
    if (!response.ok) return setMessage("Suppression impossible.");
    setMembers(members.filter((item) => item.id !== member.id));
    setMessage("Membre retiré du répertoire.");
  }

  function exportExcel() {
    const data = filtered.map(m => ({
      Matricule: m.member_number || "",
      Prénom: m.first_name,
      Nom: m.last_name,
      Téléphone: m.phone || "",
      Email: m.email || "",
      Rôle: roleLabel[m.office_role || "member"] || m.office_role,
      Titre: m.office_title || "",
      Statut: m.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Membres");
    XLSX.writeFile(wb, "membres.xlsx");
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm(`Importer les membres de ${file.name} ? (Assurez-vous d'avoir les colonnes Prénom, Nom, Téléphone, Email)`)) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setBusy(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const payload = data.map((row: any) => ({
          firstName: row["Prénom"] || row["Prenom"] || row["first_name"] || row["First Name"] || "Inconnu",
          lastName: row["Nom"] || row["last_name"] || row["Last Name"] || "Inconnu",
          phone: String(row["Téléphone"] || row["Telephone"] || row["phone"] || row["Phone"] || ""),
          email: row["Email"] || row["email"] || "",
          status: "active"
        }));

        const res = await fetch('/api/members/bulk', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ members: payload }) 
        });
        const result = await res.json();
        
        if (!res.ok) {
          toast.error(result.error);
          setMessage(result.error);
        } else {
          toast.success(result.message);
          window.location.reload();
        }
      } catch (err: any) {
        toast.error("Erreur de lecture du fichier Excel.");
      } finally {
        setBusy(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  }

  return (
    <div className="members-workspace">
      <div className="directory-toolbar">
        <div>
          <p className="eyebrow">{members.length} membre{members.length > 1 ? "s" : ""}</p>
          <h2>Liste des membres</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input aria-label="Rechercher un membre" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher…" />
          <button className="button button-small" onClick={exportExcel}>Export Excel</button>
          {canManage && (
            <>
              <input type="file" accept=".xlsx,.xls,.csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileImport} />
              <button className="button button-small" onClick={() => fileInputRef.current?.click()} disabled={busy}>Import Excel</button>
              <Link className="button button-dark" href="/dashboard/members/new">+ Créer</Link>
            </>
          )}
        </div>
      </div>
      
      {message && <p className="member-message">{message}</p>}
      {busy && <p className="member-message" style={{ color: '#1e40af', backgroundColor: '#eff6ff' }}>Importation en cours, veuillez patienter...</p>}
      
      <article className="panel directory">
        <div className="member-list">
          {filtered.map((member) => (
            <div className="member-row member-row-wide" key={member.id}>
              <span className="member-avatar">{member.photo_url ? <img src={member.photo_url} alt="" /> : `${member.first_name[0]}${member.last_name[0]}`}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <b>{member.first_name} {member.last_name}</b>
                  <WhatsAppButton phone={member.phone} message={`Bonjour ${member.first_name} ! J'espère que tu vas bien.`} />
                </div>
                <small>Matricule: {member.member_number || "Auto"} • {member.phone || member.email || "Aucun contact"}</small>
              </div>
              <span className={`member-status ${member.status}`}>{member.status === "active" ? "Actif" : member.status}</span>
              <span className="member-office-chip">{roleLabel[member.office_role || "member"] ?? member.office_role}{member.office_title ? ` · ${member.office_title}` : ""}</span>
              <div className="row-actions">
                <Link href={`/dashboard/members/${member.id}`} className="button" style={{padding: '6px 12px', background: '#e3edbd', color: '#16372b'}}>Modifier / Fiche</Link>
                {canManage && <button onClick={() => remove(member)}>Retirer</button>}
              </div>
            </div>
          ))}
          {!filtered.length && (
            <div className="empty-state">
              <div>◎</div>
              <h3>Aucun membre trouvé.</h3>
              <p>Créez un membre ou ajustez votre recherche.</p>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
