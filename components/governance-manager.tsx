"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/insforge/client";

export function GovernanceManager({
  tab: initialTab,
  organizationId,
  documents,
  reports,
  logs,
  elections,
  candidates,
  members,
  canManage
}: {
  tab?: string;
  organizationId: string;
  documents: any[];
  reports: any[];
  logs: any[];
  elections: any[];
  candidates: any[];
  members: any[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState(initialTab || "documents");

  async function createElection(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const formData = new FormData(e.currentTarget);
      const insforge = createClient();
      const { error } = await insforge.from("elections").insert({
        organization_id: organizationId,
        title: formData.get("title"),
        description: formData.get("description"),
        status: formData.get("status"),
        starts_at: formData.get("startsAt"),
        ends_at: formData.get("endsAt")
      });
      if (error) throw error;
      setNotice("✅ Élection créée. Vous pouvez maintenant ajouter des candidats.");
      e.currentTarget.reset();
      router.refresh();
    } catch (err: any) {
      setNotice(`❌ Erreur: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function addCandidate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const formData = new FormData(e.currentTarget);
      const insforge = createClient();
      const { error } = await insforge.from("election_candidates").insert({
        election_id: formData.get("electionId"),
        member_profile_id: formData.get("memberId"),
        position: formData.get("position"),
        manifesto: formData.get("manifesto")
      });
      if (error) throw error;
      setNotice("✅ Candidat ajouté à l'élection.");
      e.currentTarget.reset();
      router.refresh();
    } catch (err: any) {
      setNotice(`❌ Erreur: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="finance-workspace">
      
      <div className="finance-stats">
        <article><p>Documents</p><strong>{documents.length}</strong></article>
        <article><p>Élections</p><strong>{elections.length}</strong></article>
        <article><p>Candidats</p><strong>{candidates.length}</strong></article>
      </div>

      <div className="tabs" style={{ display: "flex", gap: "16px", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
        <button onClick={() => setActiveTab("documents")} style={{ padding: "12px 16px", borderBottom: activeTab === "documents" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "documents" ? "bold" : "normal" }}>Documents & PV</button>
        <button onClick={() => setActiveTab("elections")} style={{ padding: "12px 16px", borderBottom: activeTab === "elections" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "elections" ? "bold" : "normal" }}>Élections</button>
      </div>

      {notice && <p className="member-message">{notice}</p>}

      <div style={{ display: "grid", gridTemplateColumns: canManage && activeTab === "elections" ? "2fr 1fr" : "1fr", gap: "24px", alignItems: "start" }}>
        
        {activeTab === "documents" && (
          <article className="panel">
            <p className="eyebrow">Stockage</p>
            <h2>Documents & PV Récents</h2>
            <div className="finance-list" style={{ maxHeight: "600px", overflowY: "auto" }}>
              <table className="data-table">
                <thead><tr><th>Date</th><th>Titre</th><th>Taille</th></tr></thead>
                <tbody>
                  {documents.map(d => (
                    <tr key={d.id}>
                      <td>{new Date(d.created_at).toLocaleDateString("fr-FR")}</td>
                      <td>{d.title}</td>
                      <td>{(d.size_bytes / 1024).toFixed(0)} KB</td>
                    </tr>
                  ))}
                  {documents.length === 0 && <tr><td colSpan={3} style={{textAlign: "center", color: "#6b7280"}}>Aucun document téléversé.</td></tr>}
                </tbody>
              </table>
            </div>
          </article>
        )}

        {activeTab === "elections" && (
          <>
            <article className="panel">
              <p className="eyebrow">Suivi</p>
              <h2>Élections en cours</h2>
              <div className="finance-list" style={{ maxHeight: "600px", overflowY: "auto" }}>
                {elections.map(e => {
                  const electionCands = candidates.filter(c => c.election_id === e.id);
                  return (
                    <div key={e.id} style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <b style={{ fontSize: "16px" }}>{e.title}</b>
                          <span style={{ 
                            marginLeft: "8px", 
                            fontSize: "12px", 
                            padding: "2px 8px", 
                            borderRadius: "12px", 
                            background: e.status === "active" ? "#dcfce7" : e.status === "draft" ? "#f3f4f6" : "#fee2e2", 
                            color: e.status === "active" ? "#166534" : e.status === "draft" ? "#4b5563" : "#991b1b" 
                          }}>
                            {e.status === "active" ? "Votes en cours" : e.status === "draft" ? "Brouillon" : "Clôturée"}
                          </span>
                        </div>
                      </div>
                      
                      {electionCands.length > 0 ? (
                        <div style={{ background: "#f9fafb", padding: "12px", borderRadius: "8px" }}>
                          <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px", textTransform: "uppercase" }}>Candidats en lice</p>
                          {electionCands.map(c => (
                            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                              <span>{c.member?.first_name} {c.member?.last_name}</span>
                              <span style={{ color: "#4b5563", fontSize: "14px" }}>Pour: <b>{c.position}</b></span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: "14px", color: "#9ca3af" }}>Aucun candidat enregistré.</p>
                      )}
                    </div>
                  );
                })}
                {elections.length === 0 && <p style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>Aucune élection trouvée.</p>}
              </div>
            </article>

            {canManage && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <form className="panel compact-form" onSubmit={createElection}>
                  <p className="eyebrow">Démocratie</p>
                  <h2>Nouvelle Élection</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                    <input required name="title" placeholder="Titre de l'élection (ex: Élection du Bureau Exécutif)" style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                    <textarea name="description" placeholder="Description courte" rows={2} style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <label style={{ fontSize: "12px", color: "#6b7280" }}>Début<input name="startsAt" type="datetime-local" style={{ marginTop: "4px", width: "100%", padding: "8px", borderRadius: "6px" }} /></label>
                      <label style={{ fontSize: "12px", color: "#6b7280" }}>Fin<input name="endsAt" type="datetime-local" style={{ marginTop: "4px", width: "100%", padding: "8px", borderRadius: "6px" }} /></label>
                    </div>
                    <select name="status" required defaultValue="draft" style={{ width: "100%", padding: "8px", borderRadius: "6px" }}>
                      <option value="draft">Brouillon (Non visible)</option>
                      <option value="active">Active (Votes ouverts)</option>
                      <option value="closed">Clôturée</option>
                    </select>
                    <button disabled={busy} className="button button-dark" style={{ width: "100%" }}>Créer l'élection</button>
                  </div>
                </form>

                <form className="panel compact-form" onSubmit={addCandidate}>
                  <p className="eyebrow">Candidatures</p>
                  <h2>Ajouter un candidat</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                    <select name="electionId" required style={{ width: "100%", padding: "8px", borderRadius: "6px" }}>
                      <option value="">Choisir une élection...</option>
                      {elections.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                    <select name="memberId" required style={{ width: "100%", padding: "8px", borderRadius: "6px" }}>
                      <option value="">Sélectionner un membre...</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                    </select>
                    <input required name="position" placeholder="Poste visé (ex: Président, Secrétaire Général)" style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                    <textarea name="manifesto" placeholder="Mot d'ordre / Slogan" rows={2} style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                    <button disabled={busy} className="button button-dark" style={{ width: "100%" }}>Ajouter le candidat</button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
