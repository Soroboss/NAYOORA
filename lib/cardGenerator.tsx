import { ImageResponse } from 'next/og';
import { PDFDocument } from 'pdf-lib';
import QRCode from 'qrcode';
import { createAdminClient } from '@/lib/insforge/server';

export async function generateMemberCardFiles(member: any, settings: any, expiresAt?: Date) {
  const cardWidth = 1016; // Standard CR80 credit card ratio at 300dpi (~3.375" x 2.125")
  const cardHeight = 638;

  const insforge = await createAdminClient();

  // Helper to fetch image and convert to Base64 (avoids Satori fetch bugs and unsupported formats)
  async function fetchImageAsBase64(url: string, fallbackUrl: string): Promise<string> {
    if (!url) return fallbackUrl;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return fallbackUrl;
      const contentType = res.headers.get('content-type') || 'image/png';
      if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(contentType)) {
        console.warn(`Unsupported image type for Satori: ${contentType}`);
        return fallbackUrl;
      }
      const arrayBuffer = await res.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return `data:${contentType};base64,${base64}`;
    } catch (e) {
      console.error('Failed to fetch image for card:', url, e);
      return fallbackUrl;
    }
  }

  const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Membre';
  const defaultAvatar = `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(fullName)}`;
  
  // Pre-fetch images
  const safeLogoUrl = member.organization?.logo_url 
    ? await fetchImageAsBase64(member.organization.logo_url, '') 
    : '';
  const safePhotoUrl = await fetchImageAsBase64(member.photo_url, defaultAvatar);

  // 1. Generate QR Code Data URI
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/verify/${member.qr_token || member.id}`;
  const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200, color: { dark: settings.primary_color, light: '#ffffff' } });

  // 2. Generate Recto PNG using ImageResponse (Satori)
  const Recto = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: cardWidth,
        height: cardHeight,
        backgroundColor: '#ffffff',
        border: `8px solid ${settings.primary_color}`,
        borderRadius: settings.corner_style === 'rounded' ? '32px' : '0px',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 48px', backgroundColor: settings.primary_color, color: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {safeLogoUrl && (
            <img width={80} height={80} src={safeLogoUrl} style={{ width: 80, height: 80, borderRadius: 40 }} />
          )}
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', margin: 0 }}>{member.organization?.name || 'Organisation'}</h1>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', padding: '48px', flex: 1 }}>
        {settings.show_photo && (
          <div style={{ display: 'flex', width: '250px', marginRight: '48px' }}>
             <img width={250} height={250} src={safePhotoUrl} style={{ width: '250px', height: '250px', borderRadius: '16px' }} />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, color: settings.text_color, gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '24px', color: '#6b7280' }}>Nom Complet</span>
            <span style={{ fontSize: '42px', fontWeight: 'bold', color: settings.primary_color }}>{fullName}</span>
          </div>
          
          <div style={{ display: 'flex', gap: '48px', marginTop: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '24px', color: '#6b7280' }}>N° de Membre</span>
              <span style={{ fontSize: '32px', fontWeight: '600' }}>{member.member_number || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '24px', color: '#6b7280' }}>Statut</span>
              <span style={{ fontSize: '32px', fontWeight: '600' }}>{member.status === 'active' ? 'Actif' : 'Inactif'}</span>
            </div>
            {expiresAt && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '24px', color: '#6b7280' }}>Expire le</span>
                <span style={{ fontSize: '32px', fontWeight: '600' }}>
                  {`${expiresAt.getDate().toString().padStart(2, '0')}/${(expiresAt.getMonth() + 1).toString().padStart(2, '0')}/${expiresAt.getFullYear()}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {settings.show_qr && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <img width={180} height={180} src={qrCodeDataUrl} style={{ width: '180px', height: '180px', border: '4px solid #e5e7eb', borderRadius: '16px' }} />
          </div>
        )}
      </div>
    </div>
  );

  const rectoResponse = new ImageResponse(Recto, { width: cardWidth, height: cardHeight });
  const rectoBuffer = await rectoResponse.arrayBuffer();

  // 3. Generate Verso PNG
  const Verso = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: cardWidth,
        height: cardHeight,
        backgroundColor: '#f9fafb',
        border: `8px solid ${settings.secondary_color}`,
        borderRadius: settings.corner_style === 'rounded' ? '32px' : '0px',
        padding: '64px',
        fontFamily: 'sans-serif',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}
    >
      <h2 style={{ fontSize: '36px', color: settings.primary_color, marginBottom: '24px', fontWeight: 'bold' }}>{member.organization?.name}</h2>
      <p style={{ fontSize: '28px', color: '#4b5563', lineHeight: 1.5, maxWidth: '80%' }}>
        {settings.legal_mentions}
      </p>
      {settings.show_qr && (
        <img width={150} height={150} src={qrCodeDataUrl} style={{ width: '150px', height: '150px', marginTop: '48px', opacity: 0.8 }} />
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
  const pathPrefix = `${member.organization_id}/${member.id}`;
  
  const uploadFile = async (path: string, buffer: ArrayBuffer | Uint8Array, contentType: string) => {
    // Edge environments require a Blob to automatically determine the Content-Length
    const blob = new Blob([buffer], { type: contentType });
    const { data, error } = await insforge.storage
      .from('member_cards')
      .upload(path, blob, { contentType, upsert: true });
    
    if (error) throw error;
    
    const { data: publicUrlData } = insforge.storage
      .from('member_cards')
      .getPublicUrl(path);
      
    return publicUrlData.publicUrl;
  };

  const [frontUrl, backUrl, pdfUrl] = await Promise.all([
    uploadFile(`${pathPrefix}_front.png`, rectoBuffer, 'image/png'),
    uploadFile(`${pathPrefix}_back.png`, versoBuffer, 'image/png'),
    uploadFile(`${pathPrefix}.pdf`, pdfBytes, 'application/pdf'),
  ]);

  return { frontUrl, backUrl, pdfUrl };
}
