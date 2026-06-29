import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/insforge/server';

// Generic Webhook for Mobile Money (CinetPay, Paystack, Bizao, etc.)
// When an external provider sends a callback, this route will intercept it.
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    // In a real scenario, you would verify the signature here (e.g. HMAC with provider secret)
    // const signature = headers['x-provider-signature'];
    
    const payload = JSON.parse(rawBody);

    // Assume the provider sends { transaction_id, status: 'SUCCESS' | 'FAILED', amount, currency, custom_data }
    // `custom_data` or `metadata` usually contains the organization_id and member_id
    
    const providerReference = payload.transaction_id || payload.cpm_trans_id;
    const status = payload.status === 'SUCCESS' || payload.cpm_result == '00' ? 'confirmed' : 'failed';
    const amount = payload.amount;
    
    const supabase = await createAdminClient();

    // Log the webhook event for audit
    await supabase.from('payment_webhook_events').insert({
      provider: 'generic_mobile_money',
      event_type: 'payment.update',
      payload: payload,
      headers: headers
    });

    if (status === 'confirmed' && providerReference) {
      // Find the pending payment intent
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('provider_reference', providerReference)
        .maybeSingle();

      if (payment && payment.status !== 'confirmed') {
        // Update payment to confirmed
        await supabase
          .from('payments')
          .update({ status: 'confirmed', paid_at: new Date().toISOString() })
          .eq('id', payment.id);

        // Update corresponding contribution if it exists
        if (payment.contribution_id) {
          await supabase.rpc('process_contribution_payment', {
            p_contribution_id: payment.contribution_id,
            p_amount: amount
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
