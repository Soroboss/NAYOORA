"use client";

import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";

export function MemberCardVisual({ 
  member, 
  organization, 
  settings, 
  qrToken 
}: { 
  member: { first_name: string; last_name: string; office_title?: string | null; office_role?: string | null; photo_url?: string | null; member_number?: string | null };
  organization: { name: string; logo_url?: string | null };
  settings: { theme: string; primary_color: string };
  qrToken: string;
}) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate QR Code data URI
    const verifyUrl = `${window.location.origin}/card/${qrToken}`;
    QRCode.toDataURL(verifyUrl, { width: 128, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error(err));
  }, [qrToken]);

  const downloadImage = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true });
    const image = canvas.toDataURL("image/png", 1.0);
    const link = document.createElement("a");
    link.download = `carte-${member.first_name}-${member.last_name}.png`;
    link.href = image;
    link.click();
  };

  const roleLabel: Record<string, string> = {
    president: "Président",
    secretaire: "Secrétaire",
    tresorier: "Trésorier",
    vice_president: "Vice-président",
    commissaire: "Commissaire",
    member: "Membre",
  };
  
  const roleDisplay = member.office_title || roleLabel[member.office_role || "member"] || "Membre";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      {/* The Card */}
      <div 
        ref={cardRef}
        style={{ 
          width: '340px', 
          height: '215px', 
          position: 'relative', 
          borderRadius: '12px', 
          overflow: 'hidden', 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          backgroundColor: settings.theme === 'elegant' ? '#111827' : settings.theme === 'classic' ? '#f9fafb' : '#ffffff',
          color: settings.theme === 'elegant' ? '#ffffff' : '#1f2937',
          border: `3px solid ${settings.primary_color}`,
          display: 'flex',
          flexDirection: settings.theme === 'elegant' ? 'row' : 'column',
          fontFamily: 'sans-serif'
        }}
      >
        {settings.theme === 'elegant' && (
          <>
            <div style={{ width: '35%', backgroundColor: settings.primary_color, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
              {organization.logo_url ? (
                <img src={organization.logo_url} alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain', backgroundColor: '#fff', borderRadius: '8px', padding: '4px', marginBottom: '12px' }} crossOrigin="anonymous" />
              ) : (
                <div style={{ width: '50px', height: '50px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '12px' }}></div>
              )}
              {qrCodeUrl && <img src={qrCodeUrl} alt="QR" style={{ width: '80px', height: '80px', borderRadius: '4px', backgroundColor: '#fff', padding: '2px' }} />}
            </div>
            <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                {member.photo_url ? (
                  <img src={member.photo_url} alt="Photo" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${settings.primary_color}` }} crossOrigin="anonymous" />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#374151', border: `2px solid ${settings.primary_color}` }}></div>
                )}
              </div>
              <div style={{ fontSize: '10px', color: settings.primary_color, textTransform: 'uppercase', fontWeight: 'bold' }}>{organization.name}</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '8px' }}>{member.first_name} <br/>{member.last_name.toUpperCase()}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{roleDisplay}</div>
              <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '16px' }}>N° {member.member_number || 'N/A'}</div>
            </div>
          </>
        )}

        {settings.theme === 'classic' && (
          <>
            <div style={{ padding: '12px 16px', backgroundColor: settings.primary_color, color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {organization.logo_url ? (
                <img src={organization.logo_url} alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain', backgroundColor: '#fff', borderRadius: '4px', padding: '2px' }} crossOrigin="anonymous" />
              ) : (
                <div style={{ width: '32px', height: '32px', backgroundColor: '#fff', borderRadius: '4px' }}></div>
              )}
              <div style={{ fontSize: '14px', fontWeight: 'bold', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{organization.name}</div>
            </div>
            <div style={{ padding: '16px', flex: 1, display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: settings.primary_color }}>{member.first_name} {member.last_name.toUpperCase()}</div>
                <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '4px' }}>{roleDisplay}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '16px' }}>Matricule: {member.member_number || 'N/A'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                {member.photo_url ? (
                  <img src={member.photo_url} alt="Photo" style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover' }} crossOrigin="anonymous" />
                ) : (
                  <div style={{ width: '60px', height: '60px', backgroundColor: '#e5e7eb', borderRadius: '6px' }}></div>
                )}
                {qrCodeUrl && <img src={qrCodeUrl} alt="QR" style={{ width: '60px', height: '60px', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '2px', backgroundColor: '#fff' }} />}
              </div>
            </div>
          </>
        )}

        {settings.theme === 'modern' && (
          <>
            <div style={{ padding: '12px 16px', backgroundColor: settings.primary_color, color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {organization.logo_url ? (
                <img src={organization.logo_url} alt="Logo" style={{ width: '24px', height: '24px', objectFit: 'contain', backgroundColor: '#fff', borderRadius: '4px', padding: '2px' }} crossOrigin="anonymous" />
              ) : (
                <div style={{ width: '24px', height: '24px', backgroundColor: '#fff', borderRadius: '4px' }}></div>
              )}
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{organization.name}</div>
            </div>
            <div style={{ padding: '16px', flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
              {member.photo_url ? (
                <img src={member.photo_url} alt="Photo" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: `3px solid ${settings.primary_color}`, marginRight: '16px' }} crossOrigin="anonymous" />
              ) : (
                <div style={{ width: '80px', height: '80px', backgroundColor: '#e5e7eb', borderRadius: '8px', border: `3px solid ${settings.primary_color}`, marginRight: '16px' }}></div>
              )}
              <div style={{ flex: 1 }}>
                 <div style={{ fontSize: '18px', fontWeight: 'bold', color: settings.primary_color, lineHeight: 1.2 }}>{member.first_name} <br/>{member.last_name.toUpperCase()}</div>
                 <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>{roleDisplay}</div>
                 <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>N° {member.member_number || 'N/A'}</div>
              </div>
              <div style={{ position: 'absolute', bottom: '16px', right: '16px' }}>
                {qrCodeUrl && <img src={qrCodeUrl} alt="QR" style={{ width: '50px', height: '50px', borderRadius: '4px', border: '1px solid #e5e7eb', padding: '2px', backgroundColor: '#fff' }} />}
              </div>
            </div>
          </>
        )}
      </div>

      <button className="button button-dark" onClick={downloadImage}>Télécharger la carte (PNG)</button>
    </div>
  );
}
