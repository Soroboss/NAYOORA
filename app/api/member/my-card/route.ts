import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/insforge/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('member_session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    
    const insforge = await createAdminClient();
    
    const { data: card, error } = await insforge
      .from('member_cards')
      .select('*')
      .eq('member_profile_id', session.memberId)
      .eq('organization_id', session.organizationId)
      .single();

    if (error || !card) {
      return NextResponse.json({ success: true, card: null });
    }

    return NextResponse.json({ success: true, card });
  } catch (error: any) {
    console.error("Error fetching card:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
