'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MemberCardPage() {
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCard() {
      // Stub: in reality, fetch from API or Context
      const response = await fetch('/api/member/my-card');
      if (response.ok) {
        const data = await response.json();
        setCard(data.card);
      }
      setLoading(false);
    }
    fetchCard();
  }, []);

  if (loading) return <div className="p-4 text-center">Chargement de votre carte...</div>;

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ma Carte de Membre</h1>
        <p className="text-gray-500 text-sm">
          Présentez cette carte lors de nos événements ou pour bénéficier de vos avantages.
        </p>
      </div>

      {!card ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-2xl text-center shadow-sm">
          <div className="text-4xl mb-4">💳</div>
          <h3 className="font-bold mb-2">Carte non disponible</h3>
          <p className="text-sm">Votre carte n'a pas encore été générée par l'administration. Veuillez patienter ou contacter le secrétariat.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative group perspective">
            {/* Recto */}
            <div className="w-full aspect-[1.58] bg-white rounded-3xl shadow-xl overflow-hidden mb-6 transition-transform duration-500 hover:scale-105 relative">
              {card.front_image_url ? (
                 <img src={card.front_image_url} alt="Recto Carte" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">Recto (Aperçu indisponible)</div>
              )}
            </div>

            {/* Verso */}
            <div className="w-full aspect-[1.58] bg-white rounded-3xl shadow-xl overflow-hidden transition-transform duration-500 hover:scale-105 relative">
              {card.back_image_url ? (
                 <img src={card.back_image_url} alt="Verso Carte" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">Verso (Aperçu indisponible)</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {card.pdf_url && (
              <a 
                href={card.pdf_url} 
                download="Ma_Carte_Membre.pdf"
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium text-center flex items-center justify-center gap-2 hover:bg-gray-800 transition"
              >
                📄 Télécharger PDF HD
              </a>
            )}
            
            <a 
              href={card.front_image_url} 
              download="Recto_Carte.png"
              className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-center flex items-center justify-center gap-2 hover:border-gray-300 hover:bg-gray-50 transition"
            >
              🖼️ Télécharger Image (Recto)
            </a>
          </div>
          
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-400">Valable jusqu'au : {card.expires_at ? new Date(card.expires_at).toLocaleDateString() : 'Illimité'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
