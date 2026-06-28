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
  const Recto = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: cardWidth,
        height: cardHeight,
        backgroundColor: '#ffffff',
        border: `4px solid ${settings.primary_color || '#1e3a8a'}`,
        borderRadius: settings.corner_style === 'rounded' ? '24px' : '0px',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Top Banner with Logo and Organization Name */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 48px', backgroundColor: settings.primary_color || '#1e3a8a', color: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {safeLogoUrl && (
            <img src={safeLogoUrl} style={{ width: '80px', height: '80px', borderRadius: '40px', objectFit: 'contain', backgroundColor: '#fff' }} />
          )}
          <h1 style={{ fontSize: '42px', fontWeight: 'bold', margin: 0 }}>{member.organization?.name || 'Organisation'}</h1>
        </div>
      </div>

      {/* Main Content Body */}
      <div style={{ display: 'flex', padding: '48px', flex: 1, gap: '40px', alignItems: 'center' }}>
        {/* Photo Section */}
        {settings.show_photo !== false && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <img src={safePhotoUrl} style={{ width: '200px', height: '200px', borderRadius: '100px', objectFit: 'cover', border: `6px solid ${settings.primary_color || '#1e3a8a'}` }} />
          </div>
        )}

        {/* Member Details */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, color: settings.text_color || '#1f2937' }}>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: settings.primary_color || '#1e3a8a', lineHeight: 1.1 }}>{fullName}</span>
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

        {/* QR Code Section */}
        {settings.show_qr !== false && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <img src={qrCodeDataUrl} style={{ width: '150px', height: '150px', borderRadius: '12px' }} />
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
        border: `4px solid ${settings.secondary_color || settings.primary_color || '#1e3a8a'}`,
        borderRadius: settings.corner_style === 'rounded' ? '24px' : '0px',
        padding: '64px',
        fontFamily: 'sans-serif',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}
    >
      <h2 style={{ fontSize: '42px', color: settings.primary_color || '#1e3a8a', marginBottom: '24px', fontWeight: 'bold' }}>{member.organization?.name}</h2>
      <p style={{ fontSize: '26px', color: '#4b5563', lineHeight: 1.6, maxWidth: '85%' }}>
        {settings.legal_mentions || "Cette carte est la propriété de l'organisation. Veuillez la retourner en cas de perte."}
      </p>
      {settings.show_qr !== false && (
        <img src={qrCodeDataUrl} style={{ width: '150px', height: '150px', marginTop: '48px', mixBlendMode: 'multiply' }} />
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
