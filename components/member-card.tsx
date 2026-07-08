"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MemberCardVisual } from "./member-card-visual";

export function MemberCard({ member, orgName, orgLogo, cardSettings }: { member: any; orgName: string; orgLogo?: string; cardSettings?: any }) {
  const [cardData, setCardData] = useState<any>(member.member_cards?.[0] || null);
  const [notice, setNotice] = useState("");
  const [toggling, setToggling] = useState(false);

  const organization = { name: orgName, logo_url: orgLogo };
  const settings = cardSettings || { theme: 'modern', primary_color: '#1e40af' };
  const qrToken = cardData?.qr_token || member.qr_token || member.id;

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

  // We automatically generate the record if not exists
  const ensureCardRecord = async () => {
    if (!cardData) {
      try {
        const response = await fetch("/api/cards/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: member.id, organizationId: member.organization_id })
        });
        const data = await response.json();
        if (data.success) {
          setCardData(data.card);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="member-card-container">
      {notice && (
        <div className={`p-3 mb-4 rounded-lg text-sm w-full text-center ${notice.includes("succès") || notice.includes("active") ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
          {notice}
        </div>
      )}

      {cardData && (
        <div className="w-full space-y-4 mb-6">
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200" style={{ marginBottom: '16px' }}>
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
              style={{ cursor: 'pointer', padding: '6px 12px', border: 'none', borderRadius: '6px' }}
            >
              {toggling ? '...' : (cardData.status === 'active' ? 'Désactiver' : 'Activer')}
            </button>
          </div>
        </div>
      )}

      {!cardData && (
        <button onClick={ensureCardRecord} className="button button-small" style={{ marginBottom: '16px' }}>
          Assigner un statut officiel à la carte
        </button>
      )}

      <MemberCardVisual 
        member={member} 
        organization={organization} 
        settings={settings} 
        qrToken={qrToken} 
      />

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
