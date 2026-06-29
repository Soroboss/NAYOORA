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

  return (
    <div className="finance-workspace">
      <div className="finance-stats">
        <article><p>Fédérations</p><strong>{federations.length}</strong></article>
        <article><p>Sections Locales</p><strong>{sections.length}</strong></article>
        <article><p>Base Militante</p><strong>{members.length}</strong></article>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        {/* Colonne Cartographie & Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <article className="panel">
            <p className="eyebrow">Cartographie Électorale</p>
            <h2>Militants par localité</h2>
            <div className="finance-list" style={{ maxHeight: "300px", overflowY: "auto" }}>
              {mappedVoters.map(([loc, count]) => (
                <div key={loc} style={{ display: "flex", justifyContent: "space-between", padding: "12px", borderBottom: "1px solid #f3f4f6" }}>
                  <span><b>{loc}</b></span>
                  <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "4px 12px", borderRadius: "12px", fontSize: "14px", fontWeight: "600" }}>
                    {count} militant(s)
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <p className="eyebrow">Organigramme</p>
            <h2>Sections & Fédérations</h2>
            <div className="finance-list">
              {federations.map(f => (
                <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px", borderBottom: "1px solid #f3f4f6" }}>
                  <span>
                    <b>{f.name}</b>
                    <small style={{ display: "block", color: "#6b7280" }}>{f.region || "Région non définie"}</small>
                  </span>
                  <b>{sections.filter(s => s.federation?.name === f.name).length} section(s)</b>
                </div>
              ))}
            </div>
          </article>

        </div>

        {/* Colonne Formulaires */}
        {canManage && (
          <div className="finance-forms">
            <form className="panel compact-form" onSubmit={e => submit(e, "federation")}>
              <p className="eyebrow">Structure</p>
              <h2>Créer une fédération</h2>
              <input required name="name" placeholder="Nom de la fédération (Ex: Fédération Abidjan Sud)" />
              <input name="region" placeholder="Région" />
              <button disabled={busy} className="button button-dark">Ajouter la fédération</button>
            </form>

            <form className="panel compact-form" onSubmit={e => submit(e, "section")}>
              <p className="eyebrow">Structure</p>
              <h2>Créer une section locale</h2>
              <select name="federationId">
                <option value="">Indépendante (Sans fédération)</option>
                {federations.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <input required name="name" placeholder="Nom de la section (Ex: Section Koumassi Centre)" />
              <input name="locality" placeholder="Ville / Quartier" />
              <button disabled={busy} className="button button-dark">Ajouter la section</button>
            </form>

            <form className="panel compact-form" onSubmit={e => submit(e, "campaign")}>
              <p className="eyebrow">Opérations</p>
              <h2>Lancer une campagne terrain</h2>
              <input required name="name" placeholder="Nom de la campagne (Ex: Enrôlement 2026)" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <label style={{ fontSize: "12px", color: "#6b7280" }}>Début<input name="startsAt" type="date" style={{ marginTop: "4px" }} /></label>
                <label style={{ fontSize: "12px", color: "#6b7280" }}>Fin<input name="endsAt" type="date" style={{ marginTop: "4px" }} /></label>
              </div>
              <button disabled={busy} className="button button-dark">Lancer la campagne</button>
            </form>
            
            {notice && <p style={{ fontSize: "14px", marginTop: "8px", color: notice.startsWith("✅") ? "#059669" : "#ef4444" }}>{notice}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
