"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/insforge/client";

export function CooperativeManager({
  tab: initialTab,
  members,
  plots,
  harvests,
  sales,
  inputs,
  canManage,
  organizationId
}: {
  tab?: string;
  members: any[];
  plots: any[];
  harvests: any[];
  sales: any[];
  inputs: any[];
  canManage: boolean;
  organizationId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState(initialTab || "harvests");

  async function submitHarvest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const formData = new FormData(e.currentTarget);
      const insforge = createClient();
      const { error } = await insforge.from("harvests").insert({
        organization_id: organizationId,
        plot_id: formData.get("plotId"),
        product: formData.get("product"),
        quantity: Number(formData.get("quantity")),
        unit: formData.get("unit"),
        harvested_at: formData.get("harvestedAt")
      });
      if (error) throw error;
      setMessage("✅ Récolte enregistrée avec succès.");
      e.currentTarget.reset();
      router.refresh();
    } catch (err: any) {
      setMessage(`❌ Erreur: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function submitInput(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const formData = new FormData(e.currentTarget);
      const insforge = createClient();
      const { error } = await insforge.from("inputs").insert({
        organization_id: organizationId,
        name: formData.get("name"),
        quantity: Number(formData.get("quantity")),
        unit: formData.get("unit"),
        unit_cost: Number(formData.get("unitCost")),
        received_at: formData.get("receivedAt")
      });
      if (error) throw error;
      setMessage("✅ Entrée de stock enregistrée.");
      e.currentTarget.reset();
      router.refresh();
    } catch (err: any) {
      setMessage(`❌ Erreur: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="finance-workspace">
      
      <div className="finance-stats">
        <article>
          <p>Total Parcelles</p>
          <strong>{plots.length}</strong>
        </article>
        <article>
          <p>Récoltes Enregistrées</p>
          <strong>{harvests.length}</strong>
        </article>
        <article>
          <p>Intrants en Stock</p>
          <strong>{inputs.length}</strong>
        </article>
      </div>

      <div className="tabs" style={{ display: "flex", gap: "16px", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
        <button onClick={() => setActiveTab("harvests")} style={{ padding: "12px 16px", borderBottom: activeTab === "harvests" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "harvests" ? "bold" : "normal" }}>Récoltes & Pesées</button>
        <button onClick={() => setActiveTab("inputs")} style={{ padding: "12px 16px", borderBottom: activeTab === "inputs" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "inputs" ? "bold" : "normal" }}>Magasin & Intrants</button>
      </div>

      {message && <p className="member-message">{message}</p>}

      <div style={{ display: "grid", gridTemplateColumns: canManage ? "2fr 1fr" : "1fr", gap: "24px", alignItems: "start" }}>
        
        {activeTab === "harvests" && (
          <>
            <article className="panel">
              <p className="eyebrow">Historique</p>
              <h2>Dernières pesées / récoltes</h2>
              <div className="finance-list" style={{ maxHeight: "600px", overflowY: "auto" }}>
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Parcelle</th><th>Produit</th><th style={{textAlign: "right"}}>Quantité</th></tr></thead>
                  <tbody>
                    {harvests.map(h => (
                      <tr key={h.id}>
                        <td>{new Date(h.harvested_at).toLocaleDateString("fr-FR")}</td>
                        <td>{h.plot?.name}</td>
                        <td>{h.product}</td>
                        <td style={{textAlign: "right"}}><b>{h.quantity} {h.unit}</b></td>
                      </tr>
                    ))}
                    {harvests.length === 0 && <tr><td colSpan={4} style={{textAlign: "center", color: "#6b7280"}}>Aucune récolte enregistrée.</td></tr>}
                  </tbody>
                </table>
              </div>
            </article>

            {canManage && (
              <form className="panel compact-form" onSubmit={submitHarvest}>
                <p className="eyebrow">Nouvelle pesée</p>
                <h2>Enregistrer une récolte</h2>
                
                <select name="plotId" required style={{ width: "100%", marginBottom: "16px", padding: "8px", borderRadius: "6px" }}>
                  <option value="">Sélectionner une parcelle</option>
                  {plots.map(p => <option key={p.id} value={p.id}>{p.name} ({p.member?.first_name} {p.member?.last_name})</option>)}
                </select>

                <input type="text" name="product" required placeholder="Produit (ex: Cacao, Café)" defaultValue="Cacao" style={{ width: "100%", marginBottom: "16px", padding: "8px", borderRadius: "6px" }} />
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                  <input type="number" name="quantity" required placeholder="Quantité" min="0" step="0.01" style={{ padding: "8px", borderRadius: "6px" }} />
                  <select name="unit" required defaultValue="kg" style={{ padding: "8px", borderRadius: "6px" }}>
                    <option value="kg">Kilogrammes (kg)</option>
                    <option value="ton">Tonnes</option>
                    <option value="sac">Sacs</option>
                  </select>
                </div>

                <input type="date" name="harvestedAt" required defaultValue={new Date().toISOString().split("T")[0]} style={{ width: "100%", marginBottom: "16px", padding: "8px", borderRadius: "6px" }} />

                <button disabled={busy} className="button button-dark" style={{ width: "100%" }}>Enregistrer la pesée</button>
              </form>
            )}
          </>
        )}

        {activeTab === "inputs" && (
          <>
            <article className="panel">
              <p className="eyebrow">État des stocks</p>
              <h2>Intrants reçus</h2>
              <div className="finance-list" style={{ maxHeight: "600px", overflowY: "auto" }}>
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Nom de l'intrant</th><th style={{textAlign: "right"}}>Quantité</th><th style={{textAlign: "right"}}>Coût Unit.</th></tr></thead>
                  <tbody>
                    {inputs.map(i => (
                      <tr key={i.id}>
                        <td>{new Date(i.received_at).toLocaleDateString("fr-FR")}</td>
                        <td>{i.name}</td>
                        <td style={{textAlign: "right"}}><b>{i.quantity} {i.unit}</b></td>
                        <td style={{textAlign: "right"}}>{i.unit_cost ? `${i.unit_cost} XOF` : "-"}</td>
                      </tr>
                    ))}
                    {inputs.length === 0 && <tr><td colSpan={4} style={{textAlign: "center", color: "#6b7280"}}>Aucun intrant en stock.</td></tr>}
                  </tbody>
                </table>
              </div>
            </article>

            {canManage && (
              <form className="panel compact-form" onSubmit={submitInput}>
                <p className="eyebrow">Magasin & Stocks</p>
                <h2>Entrée d'intrants</h2>
                
                <input type="text" name="name" required placeholder="Nom de l'intrant (Engrais, Semence, etc.)" style={{ width: "100%", marginBottom: "16px", padding: "8px", borderRadius: "6px" }} />
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                  <input type="number" name="quantity" required placeholder="Quantité" min="0" step="0.01" style={{ padding: "8px", borderRadius: "6px" }} />
                  <select name="unit" required defaultValue="sac" style={{ padding: "8px", borderRadius: "6px" }}>
                    <option value="sac">Sacs</option>
                    <option value="kg">Kilogrammes (kg)</option>
                    <option value="l">Litres (L)</option>
                    <option value="unite">Unités</option>
                  </select>
                </div>

                <input type="number" name="unitCost" placeholder="Coût unitaire (Optionnel)" min="0" step="0.01" style={{ width: "100%", marginBottom: "16px", padding: "8px", borderRadius: "6px" }} />
                <input type="date" name="receivedAt" required defaultValue={new Date().toISOString().split("T")[0]} style={{ width: "100%", marginBottom: "16px", padding: "8px", borderRadius: "6px" }} />

                <button disabled={busy} className="button button-dark" style={{ width: "100%" }}>Enregistrer l'entrée</button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
