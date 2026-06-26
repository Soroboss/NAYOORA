import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/insforge/server';

export async function GET(request: Request, { params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  
  try {
    const s = await createAdminClient();
    
    // We fetch the form. We don't rely purely on RLS here since we use AdminClient, we enforce is_active manually.
    const { data: form, error } = await s
      .from('registration_forms')
      .select('id, title, description, fields, is_active, organization_id, organization:organizations(name)')
      .eq('id', formId)
      .eq('is_active', true)
      .maybeSingle();
      
    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la récupération du formulaire.' }, { status: 500 });
    }
    
    if (!form) {
      return NextResponse.json({ error: 'Ce formulaire est inactif ou introuvable.' }, { status: 404 });
    }
    
    return NextResponse.json({ form });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
