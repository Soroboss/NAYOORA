import { NextResponse } from 'next/server';
import { createClient } from '@/lib/insforge/server';

export async function POST(request: Request) {
  try {
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: membership } = await s
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (!membership || !['organization_admin', 'president'].includes(membership.role)) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
    }

    const body = await request.json();

    if (body.action === 'save_form') {
      const { data, error } = await s.from('registration_forms').upsert({
        organization_id: membership.organization_id,
        title: body.title,
        description: body.description,
        fields: body.fields,
        is_active: body.is_active,
        require_approval: body.require_approval,
        created_by: user.id
      }, { onConflict: 'organization_id' }).select().single();
      
      if (error) throw error;
      return NextResponse.json({ form: data });
    }

    if (body.action === 'approve_request' || body.action === 'reject_request') {
      const status = body.action === 'approve_request' ? 'approved' : 'rejected';
      
      // Update request
      const { data: req, error: reqErr } = await s
        .from('registration_requests')
        .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
        .eq('id', body.requestId)
        .eq('organization_id', membership.organization_id)
        .select()
        .single();
        
      if (reqErr) throw reqErr;

      // If approved, create member profile automatically
      if (status === 'approved') {
        const formData = req.data;
        const { error: profileErr } = await s.from('member_profiles').insert({
          organization_id: membership.organization_id,
          first_name: formData.firstName || '',
          last_name: formData.lastName || '',
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          status: 'active'
        });
        if (profileErr) console.error("Error creating profile:", profileErr);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
