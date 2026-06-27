import { NextResponse } from 'next/server';
import { generateMemberCard } from '@/lib/services/card/generator';
import { createClient } from '@/lib/insforge/server';
import { waitUntil } from '@vercel/functions';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { memberId, organizationId } = body;

    if (!memberId || !organizationId) {
      return NextResponse.json({ error: 'Missing memberId or organizationId' }, { status: 400 });
    }

    // Role check - ensure user is admin/president of the organization
    const { data: orgMember, error: orgMemberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (orgMemberError || !orgMember || !['organization_admin', 'president'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Since we are running in Next.js/Vercel, we can use waitUntil for async background work
    // In a long-running instance or without Vercel, this still executes asynchronously without blocking the response
    waitUntil(generateMemberCard(memberId, organizationId).catch(console.error));

    return NextResponse.json({ 
      success: true, 
      message: 'Card generation started' 
    });

  } catch (error: any) {
    console.error("API error in /api/generate-card:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
