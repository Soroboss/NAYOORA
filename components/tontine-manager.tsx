"use client";

import { FormEvent, useMemo, useState } from "react";

type Row = Record<string, any>;
const money = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);

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
  const groupParticipants = useMemo(() => participants.filter((p) => p.tontine_group_id === firstGroup), [participants, firstGroup]);
  async function submit(event: FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault(); setError(""); setLoading(action);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try { await send({ action, ...data }); location.reload(); } catch (e) { setError(e instanceof Error ? e.message : "Erreur inconnue."); setLoading(""); }
  }
  return <div className="dashboard-grid">
    <article className="panel activity"><div className="panel-heading"><div><p className="eyebrow">Groupe</p><h2>Paramètres tontine</h2></div></div>{groups.length ? groups.map((g) => <div className="list-row" key={g.id}><b>{g.name}</b><span>{money(Number(g.contribution_amount))} · {g.frequency} · commission {money(Number(g.commission_amount))}</span><small>{g.status}</small></div>) : <div className="empty-state"><div>◍</div><h3>Aucun groupe tontine</h3><p>Créez le groupe principal, puis ajoutez les participants par rang.</p></div>}{canManage && <form className="inline-form" onSubmit={(event) => submit(event, "group")}><input name="name" placeholder="Nom du groupe" defaultValue="Tontine principale" /><input name="amount" type="number" min="0" placeholder="Cotisation" /><select name="frequency"><option value="monthly">Mensuelle</option><option value="weekly">Hebdomadaire</option><option value="biweekly">Bimensuelle</option><option value="custom">Personnalisée</option></select><input name="commissionAmount" type="number" min="0" placeholder="Commission" /><button disabled={loading === "group"}>Créer</button></form>}</article>
    <article className="panel quick-actions"><p className="eyebrow">Participants</p><h2>Bénéficiaires par rang</h2>{participants.slice(0, 8).map((p) => <button key={p.id}><span>{p.payout_rank}</span>{p.display_name}<b>{p.status}</b></button>)}{canManage && <form className="inline-form" onSubmit={(event) => submit(event, "participant")}><select name="groupId" required>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select><input name="displayName" placeholder="Nom du participant" required /><input name="phone" placeholder="Téléphone" /><input name="rank" type="number" min="1" placeholder="Rang" required /><button disabled={loading === "participant"}>Ajouter</button></form>}</article>
    <article className="panel activity"><div className="panel-heading"><div><p className="eyebrow">Cycles</p><h2>Encaissement & bénéficiaire</h2></div></div>{cycles.slice(0, 8).map((c) => <div className="list-row" key={c.id}><b>Cycle {c.cycle_number}</b><span>{c.beneficiary?.display_name ?? "Bénéficiaire à définir"} · {money(Number(c.expected_amount))}</span><small>{c.collection_due_on ?? "date à fixer"} · {c.status}</small></div>)}{canManage && <form className="inline-form" onSubmit={(event) => submit(event, "cycle")}><select name="groupId" required>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select><input name="cycleNumber" type="number" min="1" placeholder="N° cycle" required /><select name="beneficiaryId"><option value="">Bénéficiaire</option>{groupParticipants.map((p) => <option key={p.id} value={p.id}>Rang {p.payout_rank} · {p.display_name}</option>)}</select><input name="expectedAmount" type="number" min="0" placeholder="Montant attendu" /><input name="collectionDueOn" type="date" /><button disabled={loading === "cycle"}>Planifier</button></form>}</article>
    <article className="panel quick-actions"><p className="eyebrow">Argent</p><h2>Encaissements & reversements</h2><button><span>IN</span>Encaissé<b>{money(collections.reduce((t, c) => t + Number(c.amount_paid || 0), 0))}</b></button><button><span>OUT</span>Reversements<b>{money(payouts.reduce((t, p) => t + Number(p.net_amount || 0), 0))}</b></button>{canManage && <form className="inline-form" onSubmit={(event) => submit(event, "collection")}><select name="groupId" required>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select><select name="cycleId" required>{cycles.map((c) => <option key={c.id} value={c.id}>Cycle {c.cycle_number}</option>)}</select><select name="participantId" required>{participants.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}</select><input name="amountDue" type="number" min="0" placeholder="À encaisser" /><input name="amountPaid" type="number" min="0" placeholder="Payé" /><button disabled={loading === "collection"}>Encaisser</button></form>}{canManage && <form className="inline-form" onSubmit={(event) => submit(event, "payout")}><select name="groupId" required>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select><select name="cycleId" required>{cycles.map((c) => <option key={c.id} value={c.id}>Cycle {c.cycle_number}</option>)}</select><select name="beneficiaryId" required>{participants.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}</select><input name="grossAmount" type="number" min="0" placeholder="Montant brut" /><input name="commissionAmount" type="number" min="0" placeholder="Commission" /><button disabled={loading === "payout"}>Reversement</button></form>}</article>
    {error && <p className="form-error">{error}</p>}
  </div>;
}
