import QRCode from 'qrcode';
import { createAdminClient } from '@/lib/insforge/server';

export async function generateAndUploadQRCode(cardId: string): Promise<string> {
  try {
    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/card/${cardId}`;
    
    // Generate QR as a buffer (PNG)
    const qrBuffer = await QRCode.toBuffer(url, {
      width: 400,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    const supabase = await createAdminClient();
    const filePath = `qrcodes/${cardId}.png`;

    // Upload to member_media bucket
    const { data, error } = await supabase.storage
      .from('member_media')
      .upload(filePath, qrBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.warn("Failed to upload QR Code to storage:", error);
      return QRCode.toDataURL(url);
    }

    const { data: publicData } = supabase.storage
      .from('member_media')
      .getPublicUrl(filePath);

    return publicData.publicUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR Code");
  }
}

export async function generateQRDataURI(cardId: string): Promise<string> {
    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/card/${cardId}`;
    return QRCode.toDataURL(url, {
      width: 400,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
}
