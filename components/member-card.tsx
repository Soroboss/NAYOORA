"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";

export function MemberCard({ member, orgName }: { member: any; orgName: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `carte_membre_${member.member_number || member.last_name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erreur lors de la génération de la carte", err);
      alert("Une erreur s'est produite lors de la génération.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="member-card-container">
      <div className="member-card" ref={cardRef}>
        <div className="card-header">
          <div className="org-brand">
            <img src="/nayoora-logo.png" alt="Logo" className="card-logo" />
            <span className="card-org-name">{orgName}</span>
          </div>
          <div className="card-title">CARTE DE MEMBRE</div>
        </div>
        <div className="card-body">
          <div className="card-photo">
            {member.photo_url ? (
              <img src={member.photo_url} alt="Photo du membre" crossOrigin="anonymous" />
            ) : (
              <div className="card-photo-placeholder">
                {member.first_name?.[0] ?? ""}{member.last_name?.[0] ?? ""}
              </div>
            )}
          </div>
          <div className="card-info">
            <h3>{member.first_name} {member.last_name}</h3>
            <p><strong>Matricule :</strong> {member.member_number}</p>
            <p><strong>Statut :</strong> {member.status === "active" ? "Actif" : "Inactif"}</p>
            <p><strong>Fonction :</strong> {member.office_title || "Membre"}</p>
            <p><strong>Téléphone :</strong> {member.phone || "N/A"}</p>
          </div>
        </div>
        <div className="card-footer">
          Valable jusqu'au {new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString("fr-FR")}
        </div>
      </div>
      <div className="card-actions">
        <button onClick={handleDownload} disabled={downloading} className="button button-dark">
          {downloading ? "Génération en cours..." : "Télécharger la carte"}
        </button>
      </div>

      <style jsx>{`
        .member-card-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .member-card {
          width: 400px;
          border-radius: 12px;
          background: linear-gradient(135deg, #f8fafc, #e2e8f0);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          position: relative;
          border: 1px solid #cbd5e1;
          color: #0f172a;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .card-header {
          background: #1e293b;
          color: white;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .org-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .card-logo {
          height: 24px;
          width: auto;
          filter: brightness(0) invert(1);
        }
        .card-org-name {
          font-weight: 600;
          font-size: 0.9rem;
        }
        .card-title {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          opacity: 0.8;
          text-transform: uppercase;
        }
        .card-body {
          display: flex;
          padding: 1.5rem;
          gap: 1.5rem;
        }
        .card-photo {
          width: 100px;
          height: 100px;
          border-radius: 8px;
          overflow: hidden;
          background: #cbd5e1;
          flex-shrink: 0;
          border: 2px solid white;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .card-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .card-photo-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: bold;
          color: #475569;
        }
        .card-info {
          flex: 1;
        }
        .card-info h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
        }
        .card-info p {
          margin: 0.25rem 0;
          font-size: 0.85rem;
          color: #334155;
        }
        .card-info strong {
          color: #0f172a;
          font-weight: 600;
        }
        .card-footer {
          background: #f1f5f9;
          padding: 0.75rem 1.5rem;
          font-size: 0.75rem;
          text-align: right;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .card-actions {
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
}
