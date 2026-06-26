import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/insforge/server';

export async function POST(request: Request) {
  try {
    const { formId, data } = await request.json();
    
    if (!formId || !data) {
      return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
    }

    const s = await createAdminClient();
    
    // Check if form is valid and active
    const { data: form, error: formError } = await s
      .from('registration_forms')
      .select('organization_id, is_active')
      .eq('id', formId)
      .eq('is_active', true)
      .maybeSingle();

    if (formError || !form) {
      return NextResponse.json({ error: 'Ce formulaire est inactif ou introuvable.' }, { status: 404 });
    }

    // Insert the request
    const { error: insertError } = await s
      .from('registration_requests')
      .insert({
        organization_id: form.organization_id,
        registration_form_id: formId,
        data: data,
        status: 'pending'
      });

    if (insertError) {
      console.error('Insert Error:', insertError);
      return NextResponse.json({ error: 'Impossible de soumettre la demande.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
