"use client";

import { useState } from "react";

export function MemberCard({ member, orgName }: { member: any; orgName: string }) {
  const [downloading, setDownloading] = useState(false);
  const [cardData, setCardData] = useState<any>(member.member_cards?.[0] || null);
  const [notice, setNotice] = useState("");
  const [toggling, setToggling] = useState(false);

  async function handleToggleStatus() {
    if (!cardData) return;
    setToggling(true);
    const newStatus = cardData.status === 'active' ? 'blocked' : 'active';
    try {
      const response = await fetch("/api/cards/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: cardData.id, status: newStatus })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCardData(data.card);
      setNotice(`La carte est maintenant ${newStatus === 'active' ? 'active' : 'désactivée'}.`);
    } catch (err: any) {
      setNotice("Erreur lors du changement de statut.");
    } finally {
      setToggling(false);
    }
  }

  async function handleGenerate() {
    setDownloading(true);
    setNotice("Génération de la carte HD en cours (cela peut prendre quelques secondes)...");
    try {
      const response = await fetch("/api/cards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          memberId: member.id, 
          organizationId: member.organization_id
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erreur de génération");
      }

      setCardData(data.card);
      setNotice("La carte a été générée et enregistrée avec succès !");
    } catch (err: any) {
      console.error("Erreur lors de la génération de la carte", err);
      setNotice(err.message || "Une erreur s'est produite lors de la génération. Veuillez vérifier les paramètres des cartes.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="member-card-container">
      {notice && (
        <div className={`p-3 mb-4 rounded-lg text-sm w-full text-center ${notice.includes("succès") || notice.includes("active") ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
          {notice}
        </div>
      )}

      {cardData ? (
        <div className="w-full space-y-4">
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div>
              <span className="text-sm font-medium text-gray-700 mr-2">Statut de la carte :</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${cardData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {cardData.status === 'active' ? 'Active' : 'Désactivée'}
              </span>
            </div>
            <button 
              onClick={handleToggleStatus} 
              disabled={toggling}
              className={`px-3 py-1 text-sm font-medium rounded-md ${cardData.status === 'active' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
            >
              {toggling ? '...' : (cardData.status === 'active' ? 'Désactiver' : 'Activer')}
            </button>
          </div>
          <div style={{ width: '100%', paddingBottom: '62.8%', position: 'relative', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
            <img src={cardData.front_image_url} alt="Recto" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ width: '100%', paddingBottom: '62.8%', position: 'relative', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
            <img src={cardData.back_image_url} alt="Verso" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
             <a href={cardData.pdf_url} target="_blank" rel="noreferrer" className="button flex-1 text-center" style={{ padding: '10px 15px', backgroundColor: '#e2e8f0', color: '#0f172a', fontWeight: 'bold', borderRadius: '8px', textDecoration: 'none' }}>📄 PDF complet</a>
             <button onClick={() => setCardData(null)} disabled={downloading} className="button flex-1 text-center" style={{ padding: '10px 15px', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>🔄 Régénérer</button>
          </div>
        </div>
      ) : (
        <div className="w-full mt-4">
            <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.5, margin: 0 }}>
                <strong>Configuration centralisée :</strong> Le design (modèle, couleurs) et la validité de cette carte seront générés automatiquement à partir des paramètres officiels de l'organisation.
              </p>
            </div>

          <button 
            onClick={handleGenerate} 
            disabled={downloading} 
            className="button button-dark"
            style={{ width: '100%', marginTop: '32px', padding: '14px', fontSize: '16px', borderRadius: '8px' }}
          >
            {downloading ? "Génération en cours..." : "Créer la carte"}
          </button>
        </div>
      )}

      <style jsx>{`
        .member-card-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
