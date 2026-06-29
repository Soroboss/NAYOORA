"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type PlanLimitInfo = {
  error: string;
  code?: string;
  limitType?: "members" | "administrators";
  currentPlan?: string;
  limit?: number;
};

type Plan = {
  id: string;
  code: string;
  name: string;
  price_xof: number;
  member_limit: number | null;
  admin_limit: number | null;
};

export function PlanLimitModal({ info, onClose }: { info: PlanLimitInfo | null; onClose: () => void }) {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyPlan, setBusyPlan] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!info) return;
    setLoading(true);
    setError("");
    fetch("/api/billing/plans")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Offres indisponibles.");
        setPlans(data.plans || []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Offres indisponibles."))
      .finally(() => setLoading(false));
  }, [info]);

  if (!info) return null;

  async function choosePlan(planId: string) {
    setBusyPlan(planId);
    setError("");
    try {
      const response = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de préparer le paiement.");
      router.push(`/billing/checkout?invoice=${encodeURIComponent(data.invoiceId)}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de préparer le paiement.");
      setBusyPlan("");
    }
  }

  const formatLimit = (value: number | null, label: string) => value === null ? `${label} illimités` : `${value} ${label}`;

  return (
    <div className="plan-limit-overlay" role="dialog" aria-modal="true" aria-labelledby="plan-limit-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="plan-limit-modal">
        <button className="plan-limit-close" type="button" onClick={onClose} aria-label="Fermer">×</button>
        <span className="plan-limit-icon">↗</span>
        <p className="eyebrow">Limite de l’offre atteinte</p>
        <h2 id="plan-limit-title">Passez à l’offre supérieure</h2>
        <p className="plan-limit-message">{info.error}</p>
        <div className="plan-limit-current">
          <span>Offre actuelle</span><strong>{info.currentPlan || "Votre offre"}</strong>
        </div>

        {loading ? <p className="plan-limit-loading">Chargement des offres…</p> : (
          <div className="plan-limit-plans">
            {plans.map((plan) => (
              <article key={plan.id}>
                <div><strong>{plan.name}</strong><span>{Number(plan.price_xof).toLocaleString("fr-FR")} F CFA</span></div>
                <p>{formatLimit(plan.member_limit, "membres")} · {formatLimit(plan.admin_limit, "administrateurs")}</p>
                <button className="button button-dark" disabled={Boolean(busyPlan)} onClick={() => choosePlan(plan.id)}>
                  {busyPlan === plan.id ? "Préparation…" : `Choisir ${plan.name}`}
                </button>
              </article>
            ))}
            {!plans.length && !loading && !error && <p>Aucune offre supérieure n’est disponible actuellement.</p>}
          </div>
        )}
        {error && <p className="form-error">{error}</p>}
        <small>Vous serez redirigé vers l’écran de paiement Wave ou Orange Money. Le numéro de secours est le +225 07 57 22 87 31.</small>
      </section>
      <style jsx>{`
        .plan-limit-overlay{position:fixed;inset:0;z-index:1200;background:rgba(2,12,27,.76);backdrop-filter:blur(7px);display:grid;place-items:center;padding:18px}.plan-limit-modal{position:relative;width:min(680px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:24px;padding:30px;box-shadow:0 30px 90px rgba(0,0,0,.35);color:#0b2447}.plan-limit-close{position:absolute;right:18px;top:14px;border:0;background:#eef4f8;border-radius:50%;width:36px;height:36px;font-size:24px;cursor:pointer;color:#0b3a6e}.plan-limit-icon{display:grid;place-items:center;width:48px;height:48px;border-radius:15px;background:linear-gradient(135deg,#0e9f6e,#0b3a6e);color:white;font-size:25px;margin-bottom:16px}.plan-limit-modal h2{font-size:clamp(1.55rem,4vw,2.15rem);margin:4px 0 9px}.plan-limit-message{color:#526174;line-height:1.55}.plan-limit-current{display:flex;justify-content:space-between;align-items:center;background:#effaf6;border:1px solid #c9eee0;border-radius:13px;padding:13px 16px;margin:20px 0}.plan-limit-current span{color:#617083}.plan-limit-plans{display:grid;gap:12px}.plan-limit-plans article{border:1px solid #dce5ec;border-radius:16px;padding:16px}.plan-limit-plans article>div{display:flex;justify-content:space-between;gap:12px}.plan-limit-plans article strong{font-size:1.05rem}.plan-limit-plans article span{font-weight:800;color:#0e9f6e}.plan-limit-plans p{font-size:.88rem;color:#657386}.plan-limit-plans button{width:100%}.plan-limit-loading{text-align:center;padding:20px;color:#657386}.plan-limit-modal>small{display:block;margin-top:18px;color:#718096;line-height:1.5}@media(max-width:560px){.plan-limit-modal{padding:24px 18px;border-radius:20px}.plan-limit-plans article>div{flex-direction:column;gap:3px}}
      `}</style>
    </div>
  );
}
