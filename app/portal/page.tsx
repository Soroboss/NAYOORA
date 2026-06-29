import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/insforge/server";
import Link from "next/link";
import QRCode from "qrcode";

export default async function PortalHomePage() {
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

  // Fetch member profile
  const { data: member } = await insforge
    .from("member_profiles")
    .select("*, organization:organizations(name)")
    .eq("id", session.memberId)
    .single();

  if (!member) {
    redirect("/api/portal/auth/logout");
  }

  // Generate QR Code for digital card
  const qrDataUrl = await QRCode.toDataURL(member.member_number || member.id, {
    color: { dark: "#111827", light: "#ffffff" },
    margin: 1,
    width: 200
  });

  return (
    <div>
      <header style={{ marginBottom: "32px", textAlign: "center" }}>
        <p className="eyebrow">Bienvenue, {member.first_name}</p>
        <h1 style={{ fontSize: "28px", marginTop: "8px" }}>Mon Espace Personnel</h1>
        <p style={{ color: "#6b7280" }}>{(member.organization as any)?.name}</p>
      </header>

      <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {/* Digital Card */}
        <div className="panel" style={{ textAlign: "center", padding: "32px" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>Carte Numérique</h2>
          <div style={{ background: "#f3f4f6", padding: "16px", borderRadius: "12px", display: "inline-block" }}>
            <img src={qrDataUrl} alt="QR Code" style={{ borderRadius: "8px" }} />
          </div>
          <div style={{ marginTop: "16px" }}>
            <p style={{ fontSize: "20px", fontWeight: "bold" }}>{member.first_name} {member.last_name}</p>
            <p style={{ color: "#6b7280", fontFamily: "monospace", fontSize: "16px", marginTop: "4px" }}>
              Matricule : {member.member_number || "Non assigné"}
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Link href="/portal/finance" style={{ textDecoration: "none" }}>
            <div className="panel" style={{ padding: "24px", transition: "transform 0.2s", cursor: "pointer", border: "2px solid transparent" }} onMouseOver={e => e.currentTarget.style.borderColor = "#2563eb"} onMouseOut={e => e.currentTarget.style.borderColor = "transparent"}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>💰</div>
              <h3 style={{ fontSize: "18px", color: "#111827", marginBottom: "8px" }}>Mes Cotisations</h3>
              <p style={{ color: "#6b7280", fontSize: "14px" }}>Consultez votre historique et payez vos arriérés par Mobile Money.</p>
            </div>
          </Link>
          
          <Link href="/portal/tontine" style={{ textDecoration: "none" }}>
            <div className="panel" style={{ padding: "24px", transition: "transform 0.2s", cursor: "pointer", border: "2px solid transparent" }} onMouseOver={e => e.currentTarget.style.borderColor = "#2563eb"} onMouseOut={e => e.currentTarget.style.borderColor = "transparent"}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔄</div>
              <h3 style={{ fontSize: "18px", color: "#111827", marginBottom: "8px" }}>Ma Tontine</h3>
              <p style={{ color: "#6b7280", fontSize: "14px" }}>Suivez vos versements et consultez votre date de réception.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
