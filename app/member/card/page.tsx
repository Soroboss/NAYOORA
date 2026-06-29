import Link from "next/link";
import { memberContext } from "@/lib/member-portal";

export default async function MemberCardPage() {
  const { profile } = await memberContext();
  const cards = (profile as any)?.member_cards;
  const card = Array.isArray(cards) ? cards[0] : cards;

  return (
    <section style={{ maxWidth: 760, margin: "0 auto" }}>
      <header style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <Link href="/member" style={{ color: "#64748b", textDecoration: "none", fontSize: ".88rem" }}>← Retour à l’accueil</Link>
        <h1 style={{ fontSize: "1.8rem", color: "#0b3a6e", margin: ".75rem 0 .35rem" }}>Ma carte de membre</h1>
        <p style={{ color: "#64748b", margin: 0 }}>Présentez-la lors des activités ou pour vérifier votre appartenance.</p>
      </header>

      {!card ? (
        <div style={{ padding: "2.5rem 1.25rem", textAlign: "center", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "1.25rem", color: "#92400e" }}>
          <div style={{ fontSize: "2.5rem" }}>💳</div>
          <h2 style={{ margin: ".75rem 0 .4rem" }}>Carte en préparation</h2>
          <p style={{ margin: 0 }}>L’administration de votre organisation n’a pas encore généré votre carte.</p>
        </div>
      ) : (
        <>
          {card.status === "blocked" && <div style={{ padding: "1rem", marginBottom: "1rem", borderRadius: ".9rem", background: "#fee2e2", color: "#991b1b", fontWeight: 600 }}>⚠️ Cette carte est actuellement désactivée.</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {[
              { label: "Recto", url: card.front_image_url },
              { label: "Verso", url: card.back_image_url },
            ].map((side) => (
              <div key={side.label}>
                <strong style={{ display: "block", color: "#334155", marginBottom: ".5rem" }}>{side.label}</strong>
                <div style={{ width: "100%", aspectRatio: "1.58", borderRadius: "1rem", overflow: "hidden", background: "linear-gradient(135deg,#071f4b,#0e9f6e)", boxShadow: "0 14px 35px rgba(15,23,42,.18)" }}>
                  {side.url ? <img src={side.url} alt={`${side.label} de la carte`} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ height: "100%", display: "grid", placeItems: "center", color: "white" }}>{side.label} indisponible</div>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gap: ".75rem", marginTop: "1.5rem" }}>
            {card.pdf_url && <a href={card.pdf_url} target="_blank" rel="noreferrer" style={{ padding: ".85rem 1rem", borderRadius: ".8rem", background: "#0b3a6e", color: "white", textDecoration: "none", textAlign: "center", fontWeight: 700 }}>📄 Ouvrir la carte PDF</a>}
            {card.front_image_url && <a href={card.front_image_url} target="_blank" rel="noreferrer" style={{ padding: ".85rem 1rem", borderRadius: ".8rem", background: "white", color: "#0b3a6e", border: "1px solid #bfdbfe", textDecoration: "none", textAlign: "center", fontWeight: 700 }}>🖼️ Ouvrir l’image recto</a>}
          </div>
          <p style={{ textAlign: "center", color: "#94a3b8", fontSize: ".78rem", marginTop: "1rem" }}>Valable jusqu’au : {card.expires_at ? new Date(card.expires_at).toLocaleDateString("fr-FR") : "sans expiration"}</p>
        </>
      )}
    </section>
  );
}
