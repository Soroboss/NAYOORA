"use client";

import { useState } from "react";

export function MemberCard({ member, orgName }: { member: any; orgName: string }) {
  const [downloading, setDownloading] = useState(false);
  const [cardData, setCardData] = useState<any>(null);
  const [notice, setNotice] = useState("");
  const [validityMonths, setValidityMonths] = useState(12);

  async function handleGenerate() {
    setDownloading(true);
    setNotice("Génération de la carte HD en cours (cela peut prendre quelques secondes)...");
    try {
      const response = await fetch("/api/cards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          memberId: member.id, 
          organizationId: member.organization_id,
          validityMonths
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
        <div className={`p-3 mb-4 rounded-lg text-sm w-full text-center ${notice.includes("succès") ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
          {notice}
        </div>
      )}

      {cardData ? (
        <div className="w-full space-y-4">
          <div className="w-full aspect-[1.58] bg-white rounded-xl shadow-xl overflow-hidden relative">
            <img src={cardData.front_image_url} alt="Recto" className="w-full h-full object-cover" />
          </div>
          <div className="w-full aspect-[1.58] bg-white rounded-xl shadow-xl overflow-hidden relative">
            <img src={cardData.back_image_url} alt="Verso" className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-4">
             <a href={cardData.pdf_url} target="_blank" rel="noreferrer" className="button flex-1 text-center">📄 PDF</a>
             <a href={cardData.front_image_url} target="_blank" rel="noreferrer" className="button flex-1 text-center">🖼️ Recto</a>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 border border-gray-200 rounded-xl w-full">
          <div className="text-4xl mb-4">🪪</div>
          <p className="text-gray-600 mb-6 text-sm">
            Générez la carte officielle pour {member.first_name} {member.last_name}. 
            Elle sera calculée selon les couleurs de votre organisation et envoyée dans l'espace du membre.
          </p>

          <div className="mb-6 text-left">
            <label className="block text-sm font-medium text-gray-700 mb-1">Durée de validité de la carte</label>
            <select 
              value={validityMonths} 
              onChange={(e) => setValidityMonths(Number(e.target.value))}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:border-black focus:ring-black border p-2 text-sm"
              disabled={downloading}
            >
              <option value={12}>1 an</option>
              <option value={24}>2 ans</option>
              <option value={36}>3 ans</option>
              <option value={60}>5 ans</option>
            </select>
          </div>

          <button onClick={handleGenerate} disabled={downloading} className="button button-dark w-full">
            {downloading ? "Création..." : "Lancer la génération"}
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
