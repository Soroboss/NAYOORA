import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient as createClient } from "@/lib/insforge/server";

export default async function PortalTontinePage() {
  const cookieStore = await cookies();
  const sessionString = cookieStore.get("portal_session")?.value;
  if (!sessionString) redirect("/portal/login");

  let session;
  try {
    session = JSON.parse(sessionString);
  } catch {
    redirect("/portal/login");
  }

  const insforge = await createClient();

  // Fetch rotating tontine participation
  const { data: participations } = await insforge
    .from("tontine_participants")
    .select("*, group:tontine_groups(*)")
    .eq("member_profile_id", session.memberId);

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px" }}>Ma Tontine</h1>
        <p style={{ color: "#6b7280" }}>Suivez votre participation à la tontine rotative.</p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {participations?.length === 0 ? (
          <div className="panel" style={{ textAlign: "center", padding: "32px" }}>
            <p style={{ color: "#6b7280" }}>Vous ne participez à aucune tontine rotative pour le moment.</p>
          </div>
        ) : (
          participations?.map((p) => {
            const group = p.group as any;
            return (
              <div key={p.id} className="panel">
                <h2 style={{ fontSize: "18px", marginBottom: "16px", borderBottom: "1px solid #f3f4f6", paddingBottom: "12px" }}>
                  {group.name}
                </h2>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ma position</span>
                    <p style={{ fontSize: "24px", fontWeight: "bold" }}>N° {p.payout_rank}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Statut du lot</span>
                    <p style={{ fontSize: "16px", fontWeight: "bold", color: p.status === "paid" ? "#059669" : "#d97706" }}>
                      {p.status === "paid" ? "Lot Reçu" : "En attente"}
                    </p>
                  </div>
                </div>

                <div style={{ background: "#f9fafb", padding: "16px", borderRadius: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: "#4b5563" }}>Contribution / tour :</span>
                    <b>{formatMoney(group.contribution_amount)}</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#4b5563" }}>Lot estimé :</span>
                    <b style={{ color: "#059669" }}>{formatMoney(group.payout_amount)}</b>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
