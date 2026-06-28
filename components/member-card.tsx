"use client";

import { useState } from "react";

export function MemberCard({ member, orgName }: { member: any; orgName: string }) {
  const [downloading, setDownloading] = useState(false);
  const [cardData, setCardData] = useState<any>(member.member_cards?.[0] || null);
  const [notice, setNotice] = useState("");
  const [validityMonths, setValidityMonths] = useState(12);
  const [theme, setTheme] = useState('modern');
  const [primaryColor, setPrimaryColor] = useState('#1e40af');
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
          organizationId: member.organization_id,
          validityMonths,
          theme,
          primaryColor
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
          <div className="w-full aspect-[1.58] bg-white rounded-xl shadow-xl overflow-hidden relative">
            <img src={cardData.front_image_url} alt="Recto" className="w-full h-full object-cover" />
          </div>
          <div className="w-full aspect-[1.58] bg-white rounded-xl shadow-xl overflow-hidden relative">
            <img src={cardData.back_image_url} alt="Verso" className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-4 mt-4">
             <a href={cardData.pdf_url} target="_blank" rel="noreferrer" className="button flex-1 text-center" style={{ padding: '10px 15px', backgroundColor: '#e2e8f0', color: '#0f172a', fontWeight: 'bold', borderRadius: '8px', textDecoration: 'none' }}>📄 PDF complet</a>
             <button onClick={() => setCardData(null)} disabled={downloading} className="button flex-1 text-center" style={{ padding: '10px 15px', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>🔄 Régénérer</button>
          </div>
        </div>
      ) : (
        <div className="w-full mt-4">
          <div className="text-left space-y-5">
            {/* Theme Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Modèle visuel</label>
              <select 
                value={theme} 
                onChange={(e) => setTheme(e.target.value)}
                disabled={downloading}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff' }}
              >
                <option value="modern">🚀 Moderne (Épuré & Clair)</option>
                <option value="classic">🏛️ Classique (Traditionnel)</option>
                <option value="elegant">✨ Élégant (Sombre & Premium)</option>
              </select>
            </div>
            
            {/* Color Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Couleur principale (ex: Logo)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="color" 
                  value={primaryColor} 
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  disabled={downloading}
                  style={{ width: '48px', height: '48px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }}
                  title="Choisir une couleur"
                />
                <input 
                  type="text" 
                  value={primaryColor.toUpperCase()} 
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  disabled={downloading}
                  placeholder="#000000"
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
              </div>
            </div>

            {/* Validity Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Durée de validité</label>
              <select 
                value={validityMonths} 
                onChange={(e) => setValidityMonths(Number(e.target.value))}
                disabled={downloading}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff' }}
              >
                <option value={12}>1 an (Standard)</option>
                <option value={24}>2 ans</option>
                <option value={36}>3 ans</option>
                <option value={60}>5 ans (Longue durée)</option>
              </select>
            </div>
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
