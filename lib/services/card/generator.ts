import { createAdminClient } from '@/lib/insforge/server';
import { generateQRDataURI } from './qrGenerator';
import { extractColorsFromLogo } from './colorExtractor';
import { renderFrontCard, renderBackCard } from './renderer';
import { generateCardPDF } from './pdfGenerator';
import crypto from 'crypto';

export async function generateMemberCard(memberId: string, organizationId: string) {
  const supabase = await createAdminClient();

  try {
    // 1. Fetch Member Data
    const { data: memberProfile, error: memberError } = await supabase
      .from('member_profiles')
      .select('first_name, last_name, avatar_url')
      .eq('id', memberId)
      .single();

    if (memberError || !memberProfile) throw new Error("Member not found");

    const { data: memberCardRecord, error: memberCardError } = await supabase
      .from('member_cards')
      .select('card_number, status, expires_at, generation_status, version, card_id')
      .eq('member_profile_id', memberId)
      .eq('organization_id', organizationId)
      .single();

    if (memberCardError && memberCardError.code !== 'PGRST116') {
      throw new Error("Failed to fetch member card info");
    }

    // 2. Fetch Organization Data
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name, logo_url')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) throw new Error("Organization not found");

    const { data: orgDetails } = await supabase
      .from('organization_details')
      .select('address, contact_email, contact_phone, website')
      .eq('organization_id', organizationId)
      .single();

    // Generate unique card_id if not exists
    let cardId = memberCardRecord?.card_id;
    let isNewRecord = false;

    if (!cardId) {
      cardId = crypto.randomUUID();
      isNewRecord = true;
      // Insert initial record with pending status
      await supabase.from('member_cards').insert({
        member_profile_id: memberId,
        organization_id: organizationId,
        card_id: cardId,
        card_number: memberCardRecord?.card_number || crypto.randomBytes(4).toString('hex').toUpperCase(),
        generation_status: 'generating',
        version: 1
      });
    } else {
      // Update existing record to generating
      await supabase.from('member_cards')
        .update({ generation_status: 'generating', version: (memberCardRecord?.version || 1) + 1 })
        .eq('member_profile_id', memberId);
    }

    // 3. Extract Colors
    // If the org has a custom theme in organization_card_settings, we would use that, but falling back to extraction
    const { data: cardSettings } = await supabase
      .from('organization_card_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    let colors;
    if (cardSettings && cardSettings.primary_color && cardSettings.primary_color !== '#1e40af') {
       colors = {
         primary: cardSettings.primary_color,
         secondary: cardSettings.secondary_color || '#3b82f6',
         text: cardSettings.text_color || '#ffffff'
       };
    } else {
       colors = await extractColorsFromLogo(organization.logo_url);
    }

    // 4. Generate QR Code
    const qrCodeDataUri = await generateQRDataURI(cardId);

    // Prepare data for rendering
    const cardData = {
      member: {
        firstName: memberProfile.first_name,
        lastName: memberProfile.last_name,
        photoUrl: memberProfile.avatar_url,
        role: "Membre", // Can fetch from organization_members if needed
        status: memberCardRecord?.status || "active",
        memberNumber: memberCardRecord?.card_number || "N/A",
        expiresAt: memberCardRecord?.expires_at
      },
      organization: {
        name: organization.name,
        logoUrl: organization.logo_url,
        address: orgDetails?.address,
        email: orgDetails?.contact_email,
        phone: orgDetails?.contact_phone,
        website: orgDetails?.website
      },
      colors,
      qrCodeDataUri
    };

    // 5. Render Images
    const frontImageBuffer = await renderFrontCard(cardData);
    const backImageBuffer = await renderBackCard(cardData);

    // 6. Upload Images
    const frontPath = `cards/${organizationId}/${memberId}_front.png`;
    const backPath = `cards/${organizationId}/${memberId}_back.png`;

    await supabase.storage.from('member_media').upload(frontPath, frontImageBuffer, { contentType: 'image/png', upsert: true });
    await supabase.storage.from('member_media').upload(backPath, backImageBuffer, { contentType: 'image/png', upsert: true });

    const { data: frontPublicUrl } = supabase.storage.from('member_media').getPublicUrl(frontPath);
    const { data: backPublicUrl } = supabase.storage.from('member_media').getPublicUrl(backPath);

    // 7. Generate PDF
    const pdfBytes = await generateCardPDF(frontImageBuffer, backImageBuffer);
    const pdfPath = `cards/${organizationId}/${memberId}_card.pdf`;
    await supabase.storage.from('member_media').upload(pdfPath, pdfBytes, { contentType: 'application/pdf', upsert: true });
    const { data: pdfPublicUrl } = supabase.storage.from('member_media').getPublicUrl(pdfPath);

    // 8. Update Database Record
    const updatePayload = {
      generation_status: 'generated',
      front_image_url: frontPublicUrl.publicUrl,
      back_image_url: backPublicUrl.publicUrl,
      pdf_url: pdfPublicUrl.publicUrl,
      theme_snapshot: colors,
      error_log: null
    };

    const { error: finalUpdateError } = await supabase
      .from('member_cards')
      .update(updatePayload)
      .eq('member_profile_id', memberId);

    if (finalUpdateError) throw finalUpdateError;

    return { success: true, cardId };

  } catch (error: any) {
    console.error("Card generation failed:", error);
    
    // Log error to database if possible
    await supabase.from('member_cards').update({
       generation_status: 'failed',
       error_log: { message: error.message, stack: error.stack }
    }).eq('member_profile_id', memberId);

    throw error;
  }
}
