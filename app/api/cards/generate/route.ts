import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/insforge/server';

// Placeholder for card generation logic
export async function POST(request: Request) {
  try {
    const { memberId, organizationId, validityMonths = 12, theme = 'modern', primaryColor } = await request.json();
    
    if (!memberId || !organizationId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const insforge = await createAdminClient();

    // 1. Fetch member details and organization card settings
    const { data: member, error: memberErr } = await insforge
      .from('member_profiles')
      .select('*, organization:organizations!organization_id(name, logo_url), member_cards(*)')
      .eq('id', memberId)
      .single();

    if (memberErr) throw new Error(`Member lookup error: ${memberErr.message}`);
    if (!member) throw new Error("Member not found");

    const { data: settings, error: settingsErr } = await insforge
      .from('organization_card_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    let finalSettings = settings;
    if (settingsErr || !settings) {
      finalSettings = {
        primary_color: primaryColor || '#1e40af',
        secondary_color: '#3b82f6',
        text_color: '#111827',
        corner_style: 'rounded',
        show_qr: true,
        show_photo: true,
        legal_mentions: "Cette carte demeure la propriété de l'organisation. Elle doit être présentée à toute demande. Toute perte doit être signalée immédiatement."
      };
    }
    
    // Override with user's specific choices in the modal
    if (theme) finalSettings.theme = theme;
    if (primaryColor) finalSettings.primary_color = primaryColor;

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + validityMonths);

    let existingCard = Array.isArray(member.member_cards) && member.member_cards.length > 0 ? member.member_cards[0] : null;
    const qrToken = existingCard?.qr_token || memberId;

    const { generateMemberCardFiles } = await import('@/lib/cardGenerator');
    const { frontUrl, backUrl, pdfUrl } = await generateMemberCardFiles(member, finalSettings, expiresAt, qrToken);

    // Insert or update member_cards table
    let cardRecord = Array.isArray(member.member_cards) && member.member_cards.length > 0 
      ? member.member_cards[0] 
      : { 
          member_profile_id: memberId,
          organization_id: organizationId,
          card_number: member.member_number || `M-${Date.now().toString().slice(-6)}`,
          qr_token: member.qr_token || memberId,
          issued_at: new Date().toISOString()
        };

    const { data: updatedCard, error: updateErr } = await insforge
      .from('member_cards')
      .upsert({
        ...cardRecord,
        expires_at: expiresAt.toISOString(),
        front_image_url: frontUrl,
        back_image_url: backUrl,
        pdf_url: pdfUrl,
        theme_snapshot: finalSettings,
        status: 'active'
      }, { onConflict: 'member_profile_id' })
      .select()
      .single();

    if (updateErr) throw new Error("Failed to save member card record: " + updateErr.message);
    
    return NextResponse.json({ success: true, card: updatedCard });

  } catch (error: any) {
    console.error("Card generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
