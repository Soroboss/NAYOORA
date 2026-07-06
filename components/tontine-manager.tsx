"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { WhatsAppButton } from "./whatsapp-button";

type Row = Record<string, any>;
const money = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);

function getTontineCollectionMessage(c: any, groups: any[]) {
  const name = c.participant?.display_name || "Participant";
  const groupName = groups.find(g => g.id === c.participant?.group_id)?.name || "notre groupe";
  return `Cher(e) ${name}, ton versement de ${money(Number(c.amount_paid))} pour ${groupName} a bien été enregistré. Merci pour ta fidélité et ton engagement fraternel !`;
}

function getTontinePayoutMessage(p: any, groups: any[]) {
  const name = p.beneficiary?.display_name || "Bénéficiaire";
  const groupName = groups.find(g => g.id === p.beneficiary?.group_id)?.name || "notre groupe";
  if (p.status === 'paid') {
    return `Cher(e) ${name}, la remise de ton gain de ${money(Number(p.net_amount))} (${groupName}) a été effectuée. Que cette somme te soit grandement bénéfique !`;
  }
  return `Félicitations cher(e) ${name} ! Ton tour est arrivé pour ${groupName}. Le montant de ${money(Number(p.net_amount))} t'est attribué et sera bientôt remis. Prépare-toi à réaliser tes beaux projets !`;
}

function getTontineReminderMessage(p: any, groups: any[]) {
  const name = p.display_name || "Participant";
  const group = groups.find(g => g.id === p.group_id);
  const groupName = group ? group.name : "notre groupe";
  const amount = group ? money(Number(group.contribution_amount)) : "ta cotisation";
  return [
    `Cher(e) ${name}, le cycle en cours pour ${groupName} attend ta contribution de ${amount}. N'oublie pas de faire ton versement. Notre force, c'est notre régularité !`,
    `Cher(e) ${name}, ${groupName} repose sur la confiance mutuelle. Ton versement de ${amount} est attendu pour permettre au bénéficiaire de recevoir son gain. Merci de faire le nécessaire au plus vite.`,
    `Cher(e) ${name}, ton retard de paiement de ${amount} bloque le cycle de ${groupName}. Le respect de la parole donnée est sacré. Merci d'agir immédiatement pour ne pas pénaliser le bénéficiaire.`
  ];
}

async function send(payload: object) {
  const response = await fetch("/api/tontine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Opération impossible.");
  return data;
}

export function TontineManager({ groups, participants, cycles, collections, payouts, canManage }: { groups: Row[]; participants: Row[]; cycles: Row[]; collections: Row[]; payouts: Row[]; canManage: boolean }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const firstGroup = groups[0]?.id ?? "";
  const [activeTab, setActiveTab] = useState("vue");

  async function submit(event: FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault(); setError(""); setLoading(action);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await send({ action, ...data });
      toast.success("Opération enregistrée avec succès.");
      location.reload();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue.";
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading("");
    }
  }

  async function markPayoutPaid(payoutId: string) {
    setError(""); setLoading(`payout-${payoutId}`);
    try {
      await send({ action: "payout_status", payoutId, status: "paid" });
      toast.success("Le reversement est confirmé comme remis au bénéficiaire.");
      location.reload();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue.";
      toast.error(msg); setError(msg); setLoading("");
    }
  }

  const inTotal = collections.reduce((t, c) => t + Number(c.amount_paid || 0), 0);
  const outTotal = payouts.reduce((t, p) => t + Number(p.net_amount || 0), 0);

  return (
    <div className="finance-workspace">
      <div className="finance-stats">
        <article>
          <p>Groupes</p>
          <strong>{groups.length}</strong>
        </article>
        <article>
          <p>Total Encaissé</p>
          <strong>{money(inTotal)}</strong>
        </article>
        <article>
          <p>Total Reversé</p>
          <strong>{money(outTotal)}</strong>
        </article>
      </div>

      <div className="tabs" style={{ display: "flex", gap: "16px", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
        <button onClick={() => setActiveTab("vue")} style={{ padding: "12px 16px", borderBottom: activeTab === "vue" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "vue" ? "bold" : "normal" }}>Groupes & Participants</button>
        <button onClick={() => setActiveTab("cycles")} style={{ padding: "12px 16px", borderBottom: activeTab === "cycles" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "cycles" ? "bold" : "normal" }}>Cycles</button>
        <button onClick={() => setActiveTab("operations")} style={{ padding: "12px 16px", borderBottom: activeTab === "operations" ? "2px solid #000" : "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", fontWeight: activeTab === "operations" ? "bold" : "normal" }}>Encaissements & Reversements</button>
      </div>

      {error && <p className="member-message">{error}</p>}

      <div className="module-split" style={{ display: "grid", gridTemplateColumns: canManage ? "2fr 1fr" : "1fr", gap: "24px", alignItems: "start" }}>
        
        {activeTab === "vue" && (
          <div className="finance-lists">
            <article className="panel">
              <p className="eyebrow">Paramètres</p>
              <h2>Groupes Tontine</h2>
              <div className="finance-list">
                {groups.length ? groups.map((g) => (
                  <div key={g.id}>
                    <span>
                      <b>{g.name}</b>
                      <small>{g.frequency} · commission {money(Number(g.commission_amount))}</small>
                    </span>
                    <b>{money(Number(g.contribution_amount))}</b>
                  </div>
                )) : <p className="muted">Aucun groupe tontine.</p>}
              </div>
            </article>
            <article className="panel">
              <p className="eyebrow">Bénéficiaires</p>
              <h2>Participants par rang</h2>
              <div className="finance-list">
                {participants.length ? participants.map((p) => (
                  <div key={p.id}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <b>Rang {p.payout_rank} — {p.display_name}</b>
                      <WhatsAppButton phone={p.phone} message={getTontineReminderMessage(p, groups)} />
                    </span>
                    <span>
                      <small>{p.status}</small>
                    </span>
                  </div>
                )) : <p className="muted">Aucun participant.</p>}
              </div>
            </article>
          </div>
        )}

        {activeTab === "cycles" && (
          <article className="panel">
            <p className="eyebrow">Planification</p>
            <h2>Encaissement & Bénéficiaire</h2>
            <div className="finance-list">
              {cycles.length ? cycles.map((c) => (
                <div key={c.id}>
                  <span>
                    <b>Cycle {c.cycle_number} · {c.beneficiary?.display_name ?? "Bénéficiaire à définir"}</b>
                    <small>{c.collection_due_on ?? "date à fixer"} · {c.status}</small>
                  </span>
                  <b>{money(Number(c.expected_amount))}</b>
                </div>
              )) : <p className="muted">Aucun cycle défini.</p>}
            </div>
          </article>
        )}

        {activeTab === "operations" && (
          <div className="finance-lists">
            <article className="panel">
              <p className="eyebrow">Entrées</p>
              <h2>Encaissements</h2>
              <div className="finance-list" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {collections.length ? collections.map((c) => (
                  <div key={c.id}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <b>{(c.participant as any)?.display_name || "Participant"}</b>
                      <WhatsAppButton phone={(c.participant as any)?.phone} message={getTontineCollectionMessage(c, groups)} />
                    </span>
                    <span>
                      <small>Cycle {(c.cycle as any)?.cycle_number}</small>
                    </span>
                    <b className="positive">+{money(Number(c.amount_paid))}</b>
                  </div>
                )) : <p className="muted">Aucun encaissement.</p>}
              </div>
            </article>
            <article className="panel">
              <p className="eyebrow">Sorties</p>
              <h2>Reversements</h2>
              <div className="finance-list" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {payouts.length ? payouts.map((p) => (
                  <div key={p.id}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <b>{p.status === "paid" ? `✓ Remis à ${(p.beneficiary as any)?.display_name || "Bénéficiaire"}` : `À remettre à ${(p.beneficiary as any)?.display_name || "Bénéficiaire"}`}</b>
                      <WhatsAppButton phone={(p.beneficiary as any)?.phone} message={getTontinePayoutMessage(p, groups)} />
                    </span>
                    <span>
                      <small>Cycle {(p.cycle as any)?.cycle_number} · {p.status === "paid" ? `remis le ${new Date(p.paid_at).toLocaleDateString("fr-FR")}` : "en attente de remise"}</small>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <b className={p.status === "paid" ? "negative" : ""}>-{money(Number(p.net_amount))}</b>
                      {canManage && p.status !== "paid" && p.status !== "cancelled" && <button disabled={loading === `payout-${p.id}`} onClick={() => markPayoutPaid(p.id)}>{loading === `payout-${p.id}` ? "Validation…" : "Marquer remis"}</button>}
                    </span>
                  </div>
                )) : <p className="muted">Aucun reversement.</p>}
              </div>
            </article>
          </div>
        )}

        {canManage && (
          <div className="finance-forms">
            {activeTab === "vue" && (
              <>
                <form className="panel compact-form" onSubmit={(event) => submit(event, "group")}>
                  <p className="eyebrow">Création</p>
                  <h2>Nouveau groupe</h2>
                  <input name="name" placeholder="Nom du groupe" defaultValue="Tontine principale" />
                  <input name="amount" type="number" min="0" placeholder="Cotisation" />
                  <select name="frequency">
                    <option value="monthly">Mensuelle</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="biweekly">Bimensuelle</option>
                    <option value="custom">Personnalisée</option>
                  </select>
                  <input name="commissionAmount" type="number" min="0" placeholder="Commission" />
                  <button disabled={loading === "group"} className="button button-dark">Créer</button>
                </form>

                <form className="panel compact-form" onSubmit={(event) => submit(event, "participant")}>
                  <p className="eyebrow">Ajout</p>
                  <h2>Nouveau participant</h2>
                  <select name="groupId" required>
                    <option value="">Choisir un groupe</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <input name="displayName" placeholder="Nom du participant" required />
                  <input name="phone" placeholder="Téléphone" />
                  <input name="rank" type="number" min="1" placeholder="Rang" required />
                  <button disabled={loading === "participant"} className="button button-dark">Ajouter</button>
                </form>
              </>
            )}

            {activeTab === "cycles" && (
              <form className="panel compact-form" onSubmit={(event) => submit(event, "cycle")}>
                <p className="eyebrow">Planification</p>
                <h2>Nouveau cycle</h2>
                <select name="groupId" required>
                  <option value="">Choisir un groupe</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <input name="cycleNumber" type="number" min="1" placeholder="N° cycle" required />
                <select name="beneficiaryId">
                  <option value="">Bénéficiaire</option>
                  {participants.map((p) => <option key={p.id} value={p.id}>Rang {p.payout_rank} · {p.display_name}</option>)}
                </select>
                <input name="expectedAmount" type="number" min="0" placeholder="Montant attendu" />
                <input name="collectionDueOn" type="date" />
                <button disabled={loading === "cycle"} className="button button-dark">Planifier</button>
              </form>
            )}

            {activeTab === "operations" && (
              <>
                <form className="panel compact-form" onSubmit={(event) => submit(event, "collection")}>
                  <p className="eyebrow">Entrées</p>
                  <h2>Encaisser</h2>
                  <select name="groupId" required>
                    <option value="">Choisir un groupe</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <select name="cycleId" required>
                    <option value="">Choisir un cycle</option>
                    {cycles.map((c) => <option key={c.id} value={c.id}>Cycle {c.cycle_number}</option>)}
                  </select>
                  <select name="participantId" required>
                    <option value="">Choisir un participant</option>
                    {participants.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
                  </select>
                  <input name="amountDue" type="number" min="0" placeholder="À encaisser" />
                  <input name="amountPaid" type="number" min="0" placeholder="Payé" />
                  <button disabled={loading === "collection"} className="button button-dark">Encaisser</button>
                </form>

                <form className="panel compact-form" onSubmit={(event) => submit(event, "payout")}>
                  <p className="eyebrow">Sorties</p>
                  <h2>Reverser</h2>
                  <select name="groupId" required>
                    <option value="">Choisir un groupe</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <select name="cycleId" required>
                    <option value="">Choisir un cycle</option>
                    {cycles.map((c) => <option key={c.id} value={c.id}>Cycle {c.cycle_number}</option>)}
                  </select>
                  <select name="beneficiaryId" required>
                    <option value="">Choisir un bénéficiaire</option>
                    {participants.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
                  </select>
                  <input name="grossAmount" type="number" min="0" placeholder="Montant brut" />
                  <input name="commissionAmount" type="number" min="0" placeholder="Commission" />
                  <select name="status" defaultValue="paid"><option value="paid">Remis maintenant au bénéficiaire</option><option value="scheduled">Programmer le reversement</option><option value="approved">Approuvé, en attente de remise</option></select>
                  <button disabled={loading === "payout"} className="button button-dark">Reverser</button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
