import { ImageResponse } from 'next/og';
import { PDFDocument } from 'pdf-lib';
import QRCode from 'qrcode';
import { createAdminClient } from '@/lib/insforge/server';

export async function generateMemberCardFiles(member: any, settings: any, expiresAt?: Date, qrToken?: string) {
  const cardWidth = 1016; // Standard CR80 credit card ratio at 300dpi (~3.375" x 2.125")
  const cardHeight = 638;

  const insforge = await createAdminClient();

  // Helper to construct absolute public URL for Supabase storage
  function getAbsoluteUrl(url: string, bucket: string, fallback: string): string {
    if (!url) return fallback;
    if (url.startsWith('http')) return url;
    if (url.startsWith('organizations/')) {
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${url}`;
    }
    return fallback;
  }

  const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Membre';
  const primaryHex = (settings.primary_color || '#1e3a8a').replace('#', '');
  const defaultAvatar = `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(fullName)}&backgroundColor=${primaryHex}&textColor=ffffff`;
  
  const safePhotoUrl = getAbsoluteUrl(member.photo_url, 'member-photos', defaultAvatar);
  const safeLogoUrl = getAbsoluteUrl(member.organization?.logo_url, 'organization-logos', '');
  
  // 1. Generate QR Code Data URI
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://nayoora.com';
  const verifyUrl = `${baseUrl}/verify/${qrToken || member.qr_token || member.id}`;
  const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200, color: { dark: settings.primary_color || '#000000', light: '#ffffff' } });

  const memberTitle = member.metadata?.titre || member.metadata?.title || member.metadata?.role || member.metadata?.profession || 'Membre';

  // 2. Generate Recto PNG using ImageResponse (Satori)
  const isClassic = settings.theme === 'classic';
  const isElegant = settings.theme === 'elegant';
  const primaryColor = settings.primary_color || '#1e3a8a';
  
  let Recto;

  if (isElegant) {
    Recto = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          height: '100%',
          backgroundColor: '#111827',
          border: `4px solid ${primaryColor}`,
          borderRadius: settings.corner_style === 'rounded' ? '24px' : '0px',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', width: '35%', backgroundColor: primaryColor, padding: '40px', alignItems: 'center', justifyContent: 'center', gap: '30px' }}>
          {safeLogoUrl && <img src={safeLogoUrl} style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'contain', backgroundColor: '#fff' }} />}
          {settings.show_photo !== false && (
            <img src={safePhotoUrl} style={{ width: '220px', height: '220px', borderRadius: '16px', objectFit: 'cover', border: '4px solid #fff' }} />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '48px', justifyContent: 'center' }}>
          <span style={{ fontSize: '20px', color: primaryColor, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>{member.organization?.name || 'Organisation'}</span>
          <span style={{ fontSize: '48px', fontWeight: 'bold', lineHeight: 1.1 }}>{fullName}</span>
          <span style={{ fontSize: '24px', fontWeight: '500', color: '#9ca3af', marginTop: '8px', textTransform: 'uppercase' }}>{memberTitle}</span>
          
          <div style={{ display: 'flex', gap: '40px', marginTop: '40px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '18px', color: '#6b7280', textTransform: 'uppercase' }}>N° de Membre</span>
              <span style={{ fontSize: '28px', fontWeight: '600' }}>{member.member_number || 'N/A'}</span>
            </div>
            {expiresAt && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '18px', color: '#6b7280', textTransform: 'uppercase' }}>Expire le</span>
                <span style={{ fontSize: '28px', fontWeight: '600' }}>
                  {`${expiresAt.getDate().toString().padStart(2, '0')}/${(expiresAt.getMonth() + 1).toString().padStart(2, '0')}/${expiresAt.getFullYear()}`}
                </span>
              </div>
            )}
          </div>
        </div>
        {settings.show_qr !== false && (
          <div style={{ display: 'flex', padding: '48px', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
            <img src={qrCodeDataUrl} style={{ width: '140px', height: '140px', borderRadius: '12px', backgroundColor: '#fff', padding: '4px' }} />
          </div>
        )}
      </div>
    );
  } else if (isClassic) {
    Recto = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#f9fafb',
          border: `4px solid ${primaryColor}`,
          borderRadius: settings.corner_style === 'rounded' ? '24px' : '0px',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
          color: '#1f2937',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: primaryColor, color: '#ffffff', gap: '20px' }}>
          {safeLogoUrl && <img src={safeLogoUrl} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'contain', backgroundColor: '#fff' }} />}
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: 0 }}>{member.organization?.name || 'Organisation'}</h1>
        </div>
        <div style={{ display: 'flex', padding: '40px', flex: 1, gap: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ fontSize: '42px', fontWeight: 'bold', color: primaryColor }}>{fullName}</span>
            <span style={{ fontSize: '22px', fontWeight: '500', color: '#4b5563', marginTop: '4px', textTransform: 'uppercase' }}>{memberTitle}</span>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '30px', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '20px', color: '#6b7280', width: '120px' }}>Matricule:</span>
                <span style={{ fontSize: '24px', fontWeight: '600' }}>{member.member_number || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '20px', color: '#6b7280', width: '120px' }}>Statut:</span>
                <span style={{ fontSize: '24px', fontWeight: '600', color: member.status === 'active' ? '#10b981' : '#ef4444' }}>{member.status === 'active' ? 'Actif' : 'Inactif'}</span>
              </div>
              {expiresAt && (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px', color: '#6b7280', width: '120px' }}>Validité:</span>
                  <span style={{ fontSize: '24px', fontWeight: '600' }}>
                    {`${expiresAt.getDate().toString().padStart(2, '0')}/${(expiresAt.getMonth() + 1).toString().padStart(2, '0')}/${expiresAt.getFullYear()}`}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            {settings.show_photo !== false && (
              <img src={safePhotoUrl} style={{ width: '200px', height: '200px', borderRadius: '16px', objectFit: 'cover', border: `4px solid ${primaryColor}` }} />
            )}
            {settings.show_qr !== false && (
              <img src={qrCodeDataUrl} style={{ width: '130px', height: '130px', borderRadius: '12px' }} />
            )}
          </div>
        </div>
      </div>
    );
  } else {
    // Modern
    Recto = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff',
          border: `4px solid ${primaryColor}`,
          borderRadius: settings.corner_style === 'rounded' ? '24px' : '0px',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 48px', backgroundColor: primaryColor, color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {safeLogoUrl && <img src={safeLogoUrl} style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'contain', backgroundColor: '#fff' }} />}
            <h1 style={{ fontSize: '42px', fontWeight: 'bold', margin: 0 }}>{member.organization?.name || 'Organisation'}</h1>
          </div>
        </div>
        <div style={{ display: 'flex', padding: '48px', flex: 1, gap: '40px', alignItems: 'center' }}>
          {settings.show_photo !== false && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <img src={safePhotoUrl} style={{ width: '200px', height: '200px', borderRadius: '16px', objectFit: 'cover', border: `6px solid ${primaryColor}` }} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, color: settings.text_color || '#1f2937' }}>
            <span style={{ fontSize: '48px', fontWeight: 'bold', color: primaryColor, lineHeight: 1.1 }}>{fullName}</span>
            <span style={{ fontSize: '24px', fontWeight: '500', color: '#4b5563', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>{memberTitle}</span>
            <div style={{ display: 'flex', gap: '40px', marginTop: '40px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '18px', color: '#6b7280', textTransform: 'uppercase' }}>N° de Membre</span>
                <span style={{ fontSize: '28px', fontWeight: '600' }}>{member.member_number || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '18px', color: '#6b7280', textTransform: 'uppercase' }}>Statut</span>
                <span style={{ fontSize: '28px', fontWeight: '600', color: member.status === 'active' ? '#10b981' : '#ef4444' }}>{member.status === 'active' ? 'Actif' : 'Inactif'}</span>
              </div>
              {expiresAt && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '18px', color: '#6b7280', textTransform: 'uppercase' }}>Expire le</span>
                  <span style={{ fontSize: '28px', fontWeight: '600' }}>
                    {`${expiresAt.getDate().toString().padStart(2, '0')}/${(expiresAt.getMonth() + 1).toString().padStart(2, '0')}/${expiresAt.getFullYear()}`}
                  </span>
                </div>
              )}
            </div>
          </div>
          {settings.show_qr !== false && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <img src={qrCodeDataUrl} style={{ width: '150px', height: '150px', borderRadius: '12px' }} />
            </div>
          )}
        </div>
      </div>
    );
  };

  const rectoResponse = new ImageResponse(Recto, { width: cardWidth, height: cardHeight });
  const rectoBuffer = await rectoResponse.arrayBuffer();

  // 3. Generate Verso PNG
  const Verso = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: isElegant ? '#111827' : '#f9fafb',
        border: `4px solid ${primaryColor}`,
        borderRadius: settings.corner_style === 'rounded' ? '24px' : '0px',
        padding: '64px',
        fontFamily: 'sans-serif',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: isElegant ? '#d1d5db' : '#4b5563',
      }}
    >
      <h2 style={{ fontSize: '42px', color: primaryColor, marginBottom: '24px', fontWeight: 'bold' }}>{member.organization?.name}</h2>
      <p style={{ fontSize: '26px', lineHeight: 1.6, maxWidth: '85%' }}>
        {settings.legal_mentions || "Cette carte est la propriété de l'organisation. Veuillez la retourner en cas de perte."}
      </p>
      {settings.show_qr !== false && (
        <img src={qrCodeDataUrl} style={{ width: '150px', height: '150px', marginTop: '48px', backgroundColor: '#fff', padding: '8px', borderRadius: '12px' }} />
      )}
    </div>
  );

  const versoResponse = new ImageResponse(Verso, { width: cardWidth, height: cardHeight });
  const versoBuffer = await versoResponse.arrayBuffer();

  // 4. Create PDF with both images
  const pdfDoc = await PDFDocument.create();
  // CR80 in points (1 point = 1/72 inch) -> 3.375 * 72 = 243, 2.125 * 72 = 153
  // Let's use A4 page and put cards on it, or just a card-sized PDF.
  // Card-sized PDF:
  const pdfWidth = 243;
  const pdfHeight = 153;

  const rectoPage = pdfDoc.addPage([pdfWidth, pdfHeight]);
  const pdfRectoImage = await pdfDoc.embedPng(rectoBuffer);
  rectoPage.drawImage(pdfRectoImage, { x: 0, y: 0, width: pdfWidth, height: pdfHeight });

  const versoPage = pdfDoc.addPage([pdfWidth, pdfHeight]);
  const pdfVersoImage = await pdfDoc.embedPng(versoBuffer);
  versoPage.drawImage(pdfVersoImage, { x: 0, y: 0, width: pdfWidth, height: pdfHeight });

  const pdfBytes = await pdfDoc.save();

  // 5. Upload to InsForge Storage
  const pathPrefix = `${member.organization_id}/${member.id}_${Date.now()}`;
  
  const uploadFile = async (path: string, buffer: ArrayBuffer | Uint8Array, contentType: string) => {
    // Edge environments require a Blob to automatically determine the Content-Length
    const blob = new Blob([buffer as any], { type: contentType });
    const { data, error } = await insforge.storage
      .from('member_cards')
      .upload(path, blob, { contentType, upsert: true });
    
    if (error) throw error;
    
    const { data: publicUrlData } = insforge.storage
      .from('member_cards')
      .getPublicUrl(path);
      
    // Append timestamp to bypass CDN cache for overwritten files
    return `${publicUrlData.publicUrl}?t=${Date.now()}`;
  };

  const [frontUrl, backUrl, pdfUrl] = await Promise.all([
    uploadFile(`${pathPrefix}_front.png`, rectoBuffer, 'image/png'),
    uploadFile(`${pathPrefix}_back.png`, versoBuffer, 'image/png'),
    uploadFile(`${pathPrefix}.pdf`, pdfBytes, 'application/pdf'),
  ]);

  return { frontUrl, backUrl, pdfUrl };
}
