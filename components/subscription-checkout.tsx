"use client";

import Link from "next/link";
import { useState } from "react";

const phone = "+2250757228731";
const displayPhone = "+225 07 57 22 87 31";

export function SubscriptionCheckout({ invoice, plan, paymentStatus }: { invoice: any; plan: any; paymentStatus: string | null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [manualOpen, setManualOpen] = useState(paymentStatus === "failed" || paymentStatus === "cancelled" || paymentStatus === "expired");
  const [provider, setProvider] = useState<"wave" | "orange_money">("wave");
  const [reference, setReference] = useState("");
  const [declared, setDeclared] = useState(false);
  const amount = Number(invoice.amount);

  async function startWave() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/billing/wave", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invoiceId: invoice.id }) });
      const payload = await response.json();
      if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error || "Wave indisponible.");
      window.location.assign(payload.checkoutUrl);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Wave indisponible."); setBusy(false); setManualOpen(true); }
  }

  async function declare() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/billing/manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invoiceId: invoice.id, provider, reference }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Déclaration impossible.");
      setDeclared(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Déclaration impossible."); }
    finally { setBusy(false); }
  }

  if (invoice.status === "paid" || paymentStatus === "succeeded") return <main className="subscription-checkout-page"><section className="subscription-checkout-card success"><img src="/icon.png" alt="" /><p className="eyebrow">Paiement confirmé</p><h1>Votre espace est activé.</h1><p>L’abonnement {plan?.name} est maintenant actif pour {(invoice.organization as any)?.name}.</p><Link className="button button-dark" href="/dashboard">Ouvrir mon tableau de bord</Link></section></main>;

  return <main className="subscription-checkout-page"><section className="subscription-checkout-card">
    <Link href="/" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link>
    <p className="eyebrow">Activation de votre espace</p><h1>Finalisez votre abonnement.</h1>
    <div className="checkout-summary"><span><small>Organisation</small><b>{(invoice.organization as any)?.name}</b></span><span><small>Formule</small><b>{plan?.name || "NAYOORA"}</b></span><span><small>Montant mensuel</small><b>{amount.toLocaleString("fr-FR")} F CFA</b></span></div>
    <button className="wave-checkout-button" onClick={startWave} disabled={busy}>{busy ? "Ouverture de Wave…" : "Payer maintenant avec Wave"}</button>
    <button className="manual-checkout-link" onClick={() => setManualOpen(true)}>Wave ne passe pas ? Utiliser Wave ou Orange Money manuellement</button>
    {paymentStatus === "pending" && <p className="billing-notice">Paiement en cours de vérification.</p>}{error && !manualOpen && <p className="form-error">{error}</p>}
  </section>
  {manualOpen && <div className="billing-modal" role="dialog" aria-modal="true" onClick={() => setManualOpen(false)}><div onClick={(event) => event.stopPropagation()}><button className="billing-modal-close" onClick={() => setManualOpen(false)}>×</button>{declared ? <div className="billing-declared"><h2>Déclaration enregistrée</h2><p>Le paiement sera contrôlé avant l’activation de l’abonnement.</p><Link href="/login">Revenir à la connexion</Link></div> : <><p className="eyebrow">Paiement de secours</p><h2>Wave ou Orange Money</h2><p>Envoyez exactement <b>{amount.toLocaleString("fr-FR")} F CFA</b> au :</p><div className="billing-phone"><b>{displayPhone}</b><button onClick={() => navigator.clipboard.writeText(phone)}>Copier</button></div><div className="billing-provider"><button className={provider === "wave" ? "active wave" : ""} onClick={() => setProvider("wave")}>Wave</button><button className={provider === "orange_money" ? "active orange" : ""} onClick={() => setProvider("orange_money")}>Orange Money</button></div><label>Référence de transaction<input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Référence reçue après paiement" /></label>{error && <p className="form-error">{error}</p>}<button className="button button-dark full" disabled={busy || reference.trim().length < 4} onClick={declare}>{busy ? "Enregistrement…" : "J’ai payé — envoyer pour validation"}</button><small className="security-note">Ne communiquez jamais votre code secret.</small></>}</div></div>}
    <style>{`
      .subscription-checkout-page{min-height:100dvh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 90% 0,#d1fae5,transparent 35%),#f6f8fc}.subscription-checkout-card{width:100%;max-width:660px;background:white;border:1px solid #e2e8f0;border-radius:26px;padding:30px;box-shadow:0 25px 70px rgba(15,23,42,.12)}.subscription-checkout-card.success{text-align:center}.subscription-checkout-card.success>img{width:72px}.subscription-checkout-card h1{font-size:clamp(1.8rem,5vw,2.5rem);color:#071f4b}.checkout-summary{display:grid;gap:10px;margin:22px 0}.checkout-summary span{display:flex;justify-content:space-between;gap:20px;padding:14px;background:#f8fafc;border-radius:12px}.checkout-summary small{color:#64748b}.wave-checkout-button{width:100%;padding:15px;border:0;border-radius:12px;background:#1dc9e8;color:#032d3c;font-weight:900;font-size:1rem;cursor:pointer}.manual-checkout-link{width:100%;margin-top:10px;border:0;background:transparent;color:#475569;text-decoration:underline;cursor:pointer}.billing-notice{padding:12px;background:#fef3c7;border-radius:10px;color:#92400e}.billing-modal{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;background:rgba(2,12,27,.74);backdrop-filter:blur(5px)}.billing-modal>div{position:relative;width:100%;max-width:440px;background:white;border-radius:22px;padding:24px}.billing-modal-close{position:absolute;right:14px;top:14px;border:0;border-radius:50%;width:34px;height:34px;font-size:20px}.billing-phone{padding:15px;background:#eff6ff;border-radius:13px;text-align:center}.billing-phone b{display:block;font-size:1.25rem;color:#0b3a6e}.billing-phone button{margin-top:7px}.billing-provider{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0}.billing-provider button{padding:11px;border:2px solid #e2e8f0;border-radius:10px;background:white;font-weight:800}.billing-provider .wave{border-color:#1dc9e8;background:#ecfeff}.billing-provider .orange{border-color:#ff7900;background:#fff7ed}.billing-modal label{display:block;font-weight:700}.billing-modal input{display:block;width:100%;margin:6px 0 14px;padding:12px;border:1px solid #cbd5e1;border-radius:10px}.security-note{display:block;text-align:center;margin-top:10px;color:#94a3b8}.billing-declared{text-align:center}.billing-declared a{color:#0b3a6e;font-weight:700}@media(max-width:600px){.subscription-checkout-page{padding:12px}.subscription-checkout-card{padding:20px;border-radius:20px}.checkout-summary span{flex-direction:column;gap:3px}}
    `}</style>
  </main>;
}
