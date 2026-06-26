import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/insforge/server';

// Placeholder for card generation logic
export async function POST(request: Request) {
  try {
    const { memberId, organizationId } = await request.json();
    
    if (!memberId || !organizationId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const insforge = await createAdminClient();

    // 1. Fetch member details and organization card settings
    const { data: member, error: memberErr } = await insforge
      .from('member_profiles')
      .select('*, organizations(name, logo_url), member_cards(*)')
      .eq('id', memberId)
      .single();

    if (memberErr || !member) throw new Error("Member not found");

    const { data: settings, error: settingsErr } = await insforge
      .from('organization_card_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (settingsErr || !settings) throw new Error("Card settings not found");

    const { generateMemberCardFiles } = await import('@/lib/cardGenerator');
    const { frontUrl, backUrl, pdfUrl } = await generateMemberCardFiles(member, settings);

    // Update member_cards table
    const { data: updatedCard, error: updateErr } = await insforge
      .from('member_cards')
      .update({
        front_image_url: frontUrl,
        back_image_url: backUrl,
        pdf_url: pdfUrl,
        theme_snapshot: settings,
        status: 'active'
      })
      .eq('member_profile_id', memberId)
      .select()
      .single();

    if (updateErr) throw new Error("Failed to update member card record");
    
    return NextResponse.json({ success: true, card: updatedCard });

  } catch (error: any) {
    console.error("Card generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
