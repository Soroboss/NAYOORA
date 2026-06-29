"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/insforge/client";

export function CooperativeManager({
  tab,
  members,
  plots,
  harvests,
  sales,
  inputs,
  canManage,
  organizationId
}: {
  tab: string;
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
      {tab === "harvests" ? (
        <>
          {canManage && (
            <div className="finance-forms">
              <form className="panel compact-form" onSubmit={submitHarvest}>
                <p className="eyebrow">Nouvelle pesée</p>
                <h2>Enregistrer une récolte</h2>
                
                <select name="plotId" required>
                  <option value="">Sélectionner une parcelle</option>
                  {plots.map(p => <option key={p.id} value={p.id}>{p.name} ({p.member?.first_name} {p.member?.last_name})</option>)}
                </select>

                <input type="text" name="product" required placeholder="Produit (ex: Cacao, Café)" defaultValue="Cacao" />
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <input type="number" name="quantity" required placeholder="Quantité" min="0" step="0.01" />
                  <select name="unit" required defaultValue="kg">
                    <option value="kg">Kilogrammes (kg)</option>
                    <option value="ton">Tonnes</option>
                    <option value="sac">Sacs</option>
                  </select>
                </div>

                <input type="date" name="harvestedAt" required defaultValue={new Date().toISOString().split("T")[0]} />

                <button disabled={busy} className="button button-dark">Enregistrer la pesée</button>
                {message && <p style={{ fontSize: "14px", marginTop: "8px", color: message.startsWith("✅") ? "#059669" : "#ef4444" }}>{message}</p>}
              </form>
            </div>
          )}

          <div className="finance-lists">
            <article className="panel">
              <p className="eyebrow">Historique</p>
              <h2>Dernières pesées / récoltes</h2>
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
            </article>
          </div>
        </>
      ) : (
        <>
          {canManage && (
            <div className="finance-forms">
              <form className="panel compact-form" onSubmit={submitInput}>
                <p className="eyebrow">Magasin & Stocks</p>
                <h2>Entrée d'intrants</h2>
                
                <input type="text" name="name" required placeholder="Nom de l'intrant (Engrais, Semence, etc.)" />
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <input type="number" name="quantity" required placeholder="Quantité" min="0" step="0.01" />
                  <select name="unit" required defaultValue="sac">
                    <option value="sac">Sacs</option>
                    <option value="kg">Kilogrammes (kg)</option>
                    <option value="l">Litres (L)</option>
                    <option value="unite">Unités</option>
                  </select>
                </div>

                <input type="number" name="unitCost" placeholder="Coût unitaire (Optionnel)" min="0" step="0.01" />
                <input type="date" name="receivedAt" required defaultValue={new Date().toISOString().split("T")[0]} />

                <button disabled={busy} className="button button-dark">Enregistrer l'entrée</button>
                {message && <p style={{ fontSize: "14px", marginTop: "8px", color: message.startsWith("✅") ? "#059669" : "#ef4444" }}>{message}</p>}
              </form>
            </div>
          )}

          <div className="finance-lists">
            <article className="panel">
              <p className="eyebrow">État des stocks</p>
              <h2>Intrants reçus</h2>
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
            </article>
          </div>
        </>
      )}
    </div>
  );
}
