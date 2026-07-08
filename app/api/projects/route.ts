import { NextResponse } from 'next/server';
import { createClient } from '@/lib/insforge/server';

const roles = ['organization_admin', 'president', 'secretaire', 'gestionnaire'];

export async function POST(r: Request) {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  const { data: m } = user ? await s.from('organization_members').select('organization_id,role').eq('user_id', user.id).eq('status', 'active').limit(1).maybeSingle() : { data: null };
  if (!user || !m || !roles.includes(m.role)) return NextResponse.json({ error: 'Droits de gestion requis.' }, { status: 403 });

  try {
    const b = await r.json();
    const o = m.organization_id;

    if (b.action === 'project') {
      if (!b.name) throw Error('Le nom du projet est requis.');
      const { data, error } = await s.from('projects').insert({
        organization_id: o,
        name: b.name,
        description: b.description || null,
        starts_at: b.startsAt || null,
        ends_at: b.endsAt || null,
        status: 'draft'
      }).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data });
    }

    if (b.action === 'update_project') {
      if (!b.projectId) throw Error('Le projet est requis.');
      const updates: any = {};
      if (b.status !== undefined) updates.status = b.status;
      
      const { error } = await s.from('projects').update(updates).eq('id', b.projectId).eq('organization_id', o);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    throw Error('Action inconnue.');
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Opération impossible.' }, { status: 400 });
  }
}
