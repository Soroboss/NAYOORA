import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient as createClient } from "@/lib/insforge/server";
import { DeclarePaymentButton } from "./declare-payment";
import { WavePaymentButton } from "@/components/wave-payment-button";

export default async function PortalFinancePage() {
  const cookieStore = await cookies();
  const sessionString = cookieStore.get("portal_session")?.value;
  if (!sessionString) redirect("/member/login");

  let session;
  try {
    session = JSON.parse(sessionString);
  } catch {
    redirect("/member/login");
  }

  const insforge = await createClient();

  // Fetch contributions for this member
  const { data: contributions } = await insforge
    .from("contributions")
    .select("*, plan:contribution_plans(name)")
    .eq("member_profile_id", session.memberId)
    .order("due_date", { ascending: false });

  // Fetch pending payments to see if a contribution is already pending
  const { data: pendingPayments } = await insforge
    .from("payments")
    .select("contribution_plan_id, status")
    .eq("member_profile_id", session.memberId)
    .eq("status", "pending");
  
  const pendingPlanIds = pendingPayments?.map(p => p.contribution_plan_id) || [];

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px" }}>Mes Cotisations</h1>
        <p style={{ color: "#6b7280" }}>Historique de vos paiements et état de vos arriérés.</p>
      </header>

      <div className="finance-list" style={{ border: "1px solid #e5e7eb", borderRadius: "8px", background: "white" }}>
        {contributions?.length === 0 ? (
          <p style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>Aucune cotisation enregistrée.</p>
        ) : (
          contributions?.map((c) => {
            const isPaid = c.status === "paid";
            const isPending = !isPaid && pendingPlanIds.includes(c.contribution_plan_id);

            return (
              <div key={c.id} className="finance-item">
                <div className="finance-details">
                  <b style={{ display: "block", fontSize: "16px" }}>{(c.plan as any)?.name || "Cotisation"}</b>
                  <small style={{ color: "#6b7280", display: "block", marginTop: "4px" }}>Échéance : {new Date(c.due_date).toLocaleDateString("fr-FR")}</small>
                  <div style={{ marginTop: "8px" }}>
                    <span style={{ 
                      fontSize: "12px", 
                      padding: "4px 10px", 
                      borderRadius: "12px", 
                      background: isPaid ? "#dcfce7" : isPending ? "#fef08a" : "#fee2e2", 
                      color: isPaid ? "#166534" : isPending ? "#854d0e" : "#991b1b",
                      fontWeight: "600"
                    }}>
                      {isPaid ? "Payé" : isPending ? "En cours de validation" : "En attente"}
                    </span>
                  </div>
                </div>
                <div className="finance-actions">
                  <b className="amount-text">{formatMoney(c.amount_due)}</b>
                  {!isPaid && !isPending && (
                    <div className="action-buttons">
                      <WavePaymentButton contributionId={c.id} amountDue={Number(c.amount_due) - Number(c.amount_paid || 0)} />
                      <DeclarePaymentButton 
                        contributionId={c.id} 
                        planId={c.contribution_plan_id} 
                        amountDue={c.amount_due} 
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .finance-item {
          padding: 20px;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .finance-actions {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .amount-text {
          display: block;
          font-size: 18px;
          color: #111827;
          margin-bottom: 12px;
        }
        .action-buttons {
          display: flex;
          gap: 8px;
        }

        /* Mobile Responsive adjustments */
        @media (max-width: 640px) {
          .finance-item {
            flex-direction: column;
            align-items: flex-start;
          }
          .finance-actions {
            width: 100%;
            align-items: flex-start;
            text-align: left;
            margin-top: 12px;
            border-top: 1px dashed #e5e7eb;
            padding-top: 16px;
          }
          .amount-text {
            margin-bottom: 16px;
          }
          .action-buttons {
            width: 100%;
            flex-direction: column;
          }
          .action-buttons > * {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
