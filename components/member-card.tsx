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
        <div className="text-center p-8 bg-white border border-gray-100 shadow-xl rounded-2xl w-full max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="4" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
                <path d="M12 14l2-2 2 2" />
                <path d="M14 12v5" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">Design de la carte</h3>
          <p className="text-gray-500 mb-8 text-sm">
            Personnalisez l'apparence de la carte officielle de {member.first_name}.
          </p>

          <div className="text-left space-y-6">
            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Modèle visuel</label>
              <div className="relative">
                <select 
                  value={theme} 
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full appearance-none border border-gray-300 rounded-xl shadow-sm px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  disabled={downloading}
                >
                  <option value="modern">🚀 Moderne (Épuré & Clair)</option>
                  <option value="classic">🏛️ Classique (Traditionnel)</option>
                  <option value="elegant">✨ Élégant (Sombre & Premium)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            
            {/* Color Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Couleur de l'organisation</label>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl shadow-inner border border-gray-200 overflow-hidden shrink-0 transition-transform hover:scale-105" style={{ backgroundColor: primaryColor }}>
                  <input 
                    type="color" 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={downloading}
                    title="Choisir une couleur"
                  />
                </div>
                <input 
                  type="text" 
                  value={primaryColor.toUpperCase()} 
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-xl shadow-sm px-4 py-3 text-sm uppercase tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  disabled={downloading}
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Validity Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Durée de validité</label>
              <div className="relative">
                <select 
                  value={validityMonths} 
                  onChange={(e) => setValidityMonths(Number(e.target.value))}
                  className="w-full appearance-none border border-gray-300 rounded-xl shadow-sm px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  disabled={downloading}
                >
                  <option value={12}>1 an (Standard)</option>
                  <option value={24}>2 ans</option>
                  <option value={36}>3 ans</option>
                  <option value={60}>5 ans (Longue durée)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={downloading} 
            className="w-full mt-8 bg-gray-900 hover:bg-black text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2"
          >
            {downloading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Génération en cours...
              </>
            ) : (
              "Créer la carte"
            )}
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
