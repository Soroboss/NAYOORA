import { NextResponse } from 'next/server';
import { createClient } from '@/lib/insforge/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // For now we get organization_id from the first active membership since there's no org context in simple body
    // Wait, the client didn't send organization_id? Let's assume they did, or we fetch it.
    // Ah, wait, MobileMoneyManager does NOT send organizationId in body! It just sends the form data. Let's fix that.
    
    const { provider, name, phone, action, organizationId } = body;

    // Verify role
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership || !['organization_admin', 'president', 'tresorier'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === "create_cash_account") {
      const { error } = await supabase.from('cash_accounts').insert({
        organization_id: organizationId,
        name: `${name} (${phone})`, // Ex: Caisse Principale (+225...)
        account_type: 'mobile_money',
        currency: provider // store provider in currency since we don't have a provider field in cash_accounts
      });

      if (error) {
        console.error("Cash account creation error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action unknown' }, { status: 400 });

  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
