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

    const { organizationId, channel, body, recipients } = await request.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Aucun destinataire sélectionné' }, { status: 400 });
    }

    // Verify role (admin, president, secretary, gestionnaire)
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership || !["organization_admin", "president", "secretaire", "gestionnaire"].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create the main message
    const { data: message, error: messageError } = await supabase.from('messages').insert({
      organization_id: organizationId,
      channel: channel === 'whatsapp' ? 'whatsapp' : (channel === 'email' ? 'email' : 'sms'),
      body: body,
      status: 'sent', // we mock as sent directly
      created_by: user.id,
      sent_at: new Date().toISOString()
    }).select().single();

    if (messageError) throw messageError;

    // Create recipients
    const recipientsData = recipients.map(memberId => ({
      message_id: message.id,
      organization_id: organizationId,
      member_profile_id: memberId,
      status: 'sent',
      sent_at: new Date().toISOString()
    }));

    const { error: recipientsError } = await supabase.from('message_recipients').insert(recipientsData);
    
    if (recipientsError) throw recipientsError;

    // Note: Here is where you would call Twilio API or Resend API in reality.
    // For now, the system records that the messages were sent.

    return NextResponse.json({ success: true, count: recipients.length });

  } catch (error: any) {
    console.error("Message send error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
