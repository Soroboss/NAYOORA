"use client";

import { FormEvent, useState } from "react";

export function PoliticalManager({
  federations,
  sections,
  campaigns,
  members,
  canManage
}: {
  federations: any[];
  sections: any[];
  campaigns: any[];
  members: any[];
  canManage: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/political", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...Object.fromEntries(new FormData(e.currentTarget)) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNotice("✅ Enregistrement effectué. Actualisez la page pour voir les changements.");
      e.currentTarget.reset();
    } catch (err: any) {
      setNotice(`❌ Erreur : ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  // Aggregate members by Locality/Address
  const mapping = new Map<string, number>();
  members.forEach(m => {
    const loc = m.address?.trim() || "Non assigné";
    mapping.set(loc, (mapping.get(loc) || 0) + 1);
  });
  const mappedVoters = Array.from(mapping.entries()).sort((a, b) => b[1] - a[1]);

  const [activeTab, setActiveTab] = useState("carto");

  return (
    <div className="finance-workspace">
      <div className="finance-stats">
        <article><p>Fédérations</p><strong>{federations.length}</strong></article>
        <article><p>Sections Locales</p><strong>{sections.length}</strong></article>
        <article><p>Base Militante</p><strong>{members.length}</strong></article>
      </div>

      {notice && <div style={{ padding: "12px", background: notice.startsWith("✅") ? "#dcfce7" : "#fee2e2", color: notice.startsWith("✅") ? "#166534" : "#991b1b", borderRadius: "8px", marginBottom: "16px" }}>{notice}</div>}

      <div className="tabs" style={{ display: "flex", gap: "16px", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
        <button onClick={() => setActiveTab("carto")} style={{ padding: "12px 16px", borderBottom: activeTab === "carto" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "carto" ? "bold" : "normal" }}>Cartographie</button>
        <button onClick={() => setActiveTab("structure")} style={{ padding: "12px 16px", borderBottom: activeTab === "structure" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "structure" ? "bold" : "normal" }}>Structures & Organigramme</button>
        <button onClick={() => setActiveTab("campaigns")} style={{ padding: "12px 16px", borderBottom: activeTab === "campaigns" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "campaigns" ? "bold" : "normal" }}>Campagnes Terrain</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: canManage ? "2fr 1fr" : "1fr", gap: "24px" }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {activeTab === "carto" && (
            <article className="panel">
              <p className="eyebrow">Cartographie Électorale</p>
              <h2>Militants par localité</h2>
              <div className="finance-list" style={{ maxHeight: "500px", overflowY: "auto" }}>
                {mappedVoters.length === 0 ? (
                  <p style={{ color: "#6b7280", padding: "20px" }}>Aucun militant enregistré avec une adresse.</p>
                ) : (
                  mappedVoters.map(([loc, count]) => (
                    <div key={loc} style={{ display: "flex", justifyContent: "space-between", padding: "16px", borderBottom: "1px solid #f3f4f6" }}>
                      <span><b>{loc}</b></span>
                      <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "4px 12px", borderRadius: "12px", fontSize: "14px", fontWeight: "600" }}>
                        {count} militant(s)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </article>
          )}

          {activeTab === "structure" && (
            <article className="panel">
              <p className="eyebrow">Organigramme</p>
              <h2>Sections & Fédérations</h2>
              <div className="finance-list" style={{ maxHeight: "500px", overflowY: "auto" }}>
                {federations.length === 0 ? (
                  <p style={{ color: "#6b7280", padding: "20px" }}>Aucune fédération définie.</p>
                ) : (
                  federations.map(f => (
                    <div key={f.id} style={{ padding: "16px", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span>
                          <b style={{ fontSize: "16px" }}>{f.name}</b>
                          <small style={{ display: "block", color: "#6b7280", marginTop: "4px" }}>Région : {f.region || "Non définie"}</small>
                        </span>
                        <span style={{ background: "#f3f4f6", padding: "4px 12px", borderRadius: "12px", fontSize: "14px", height: "fit-content" }}>
                          <b>{sections.filter(s => s.federation?.name === f.name).length} section(s)</b>
                        </span>
                      </div>
                      <div style={{ paddingLeft: "16px", borderLeft: "2px solid #e5e7eb", marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        {sections.filter(s => s.federation?.name === f.name).map(s => (
                          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                            <span>↳ {s.name}</span>
                            <span style={{ color: "#6b7280" }}>{s.locality || "-"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          )}

          {activeTab === "campaigns" && (
            <article className="panel">
              <p className="eyebrow">Opérations</p>
              <h2>Campagnes en cours</h2>
              <div className="finance-list" style={{ maxHeight: "500px", overflowY: "auto" }}>
                {campaigns.length === 0 ? (
                  <p style={{ color: "#6b7280", padding: "20px" }}>Aucune campagne terrain enregistrée.</p>
                ) : (
                  campaigns.map(c => (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "16px", borderBottom: "1px solid #f3f4f6" }}>
                      <span>
                        <b style={{ fontSize: "16px", display: "block" }}>{c.name}</b>
                        <small style={{ color: "#6b7280", marginTop: "4px", display: "block" }}>
                          Du {new Date(c.starts_at).toLocaleDateString("fr-FR")} au {new Date(c.ends_at).toLocaleDateString("fr-FR")}
                        </small>
                      </span>
                      <span style={{ background: c.status === "active" ? "#dcfce7" : "#f3f4f6", color: c.status === "active" ? "#166534" : "#4b5563", padding: "6px 12px", borderRadius: "12px", fontSize: "14px", fontWeight: "600", height: "fit-content" }}>
                        {c.status === "active" ? "En cours" : c.status === "completed" ? "Terminée" : c.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </article>
          )}

        </div>

        {/* Colonne Formulaires */}
        {canManage && (
          <div className="finance-forms">
            
            {activeTab === "structure" && (
              <>
                <form className="panel compact-form" onSubmit={e => submit(e, "federation")}>
                  <p className="eyebrow">Ajout</p>
                  <h2>Créer une fédération</h2>
                  <input required name="name" placeholder="Nom (Ex: Fédération Abidjan Sud)" />
                  <input name="region" placeholder="Région" />
                  <button disabled={busy} className="button button-dark">Ajouter</button>
                </form>

                <form className="panel compact-form" onSubmit={e => submit(e, "section")}>
                  <p className="eyebrow">Ajout</p>
                  <h2>Créer une section locale</h2>
                  <select name="federationId">
                    <option value="">Sélectionner une fédération...</option>
                    {federations.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <input required name="name" placeholder="Nom (Ex: Section Koumassi Centre)" />
                  <input name="locality" placeholder="Ville / Quartier" />
                  <button disabled={busy} className="button button-dark">Ajouter</button>
                </form>
              </>
            )}

            {activeTab === "campaigns" && (
              <form className="panel compact-form" onSubmit={e => submit(e, "campaign")}>
                <p className="eyebrow">Opérations</p>
                <h2>Lancer une campagne</h2>
                <input required name="name" placeholder="Nom (Ex: Enrôlement 2026)" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: "bold" }}>Date de début<input name="startsAt" type="date" required style={{ marginTop: "4px" }} /></label>
                  <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: "bold" }}>Date de fin<input name="endsAt" type="date" required style={{ marginTop: "4px" }} /></label>
                </div>
                <button disabled={busy} className="button button-dark">Lancer</button>
              </form>
            )}

            {activeTab === "carto" && (
              <div className="panel" style={{ padding: "24px", background: "#f8fafc" }}>
                <h3>Astuce Cartographie</h3>
                <p style={{ fontSize: "14px", color: "#475569", marginTop: "8px", lineHeight: "1.5" }}>
                  La cartographie regroupe automatiquement vos militants selon l'adresse ou la localité renseignée dans leur profil. 
                  Pour avoir des données précises, assurez-vous de bien remplir les adresses lors de l'enrôlement.
                </p>
                <a href="/dashboard/members/new" className="button button-dark" style={{ display: "block", textAlign: "center", marginTop: "16px" }}>Enrôler un militant</a>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
