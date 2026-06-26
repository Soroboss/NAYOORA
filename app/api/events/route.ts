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

    if (b.action === 'event') {
      if (!b.title || !b.startsAt) throw Error('Titre et date requis.');
      const { data, error } = await s.from('events').insert({
        organization_id: o,
        title: b.title,
        description: b.description || null,
        location: b.location || null,
        starts_at: b.startsAt,
        ends_at: b.endsAt || null,
        created_by: user.id
      }).select().single();
      if (error) throw error;

      // Automatically invite all active members and send an internal notification
      const { data: members } = await s.from('member_profiles').select('id,phone').eq('organization_id', o).eq('status', 'active').is('deleted_at', null);
      if (members && members.length > 0) {
        await s.from('event_invitations').upsert(
          members.map((member: any) => ({
            organization_id: o,
            event_id: data.id,
            member_profile_id: member.id,
            status: 'sent'
          })),
          { onConflict: 'event_id,member_profile_id' }
        );

        // Create internal notification
        const { data: msg } = await s.from('messages').insert({
          organization_id: o,
          channel: 'internal',
          subject: 'Nouvelle réunion planifiée',
          body: `Une nouvelle réunion a été planifiée : ${b.title}. Date : ${new Date(b.startsAt).toLocaleString('fr-FR')}. ${b.location ? 'Lieu : ' + b.location : ''}`,
          status: 'sent',
          created_by: user.id,
          sent_at: new Date().toISOString()
        }).select().single();

        if (msg) {
          await s.from('message_recipients').insert(
            members.map((member: any) => ({
              organization_id: o,
              message_id: msg.id,
              member_profile_id: member.id,
              destination: member.phone || 'internal',
              status: 'delivered'
            }))
          );
        }
      }
      return NextResponse.json({ item: data });
    }

    if (b.action === 'invite') {
      if (!b.eventId || !Array.isArray(b.memberIds) || !b.memberIds.length) throw Error('Événement et au moins un membre requis.');
      const { error } = await s.from('event_invitations').upsert(
        b.memberIds.map((id: string) => ({ organization_id: o, event_id: b.eventId, member_profile_id: id, status: 'sent' })),
        { onConflict: 'event_id,member_profile_id' }
      );
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (b.action === 'attendance') {
      if (!b.eventId || !b.memberId) throw Error('Membre et événement requis.');
      const { error } = await s.from('event_attendance').upsert({
        organization_id: o,
        event_id: b.eventId,
        member_profile_id: b.memberId,
        status: b.status || 'attended',
        checked_in_at: new Date().toISOString()
      }, { onConflict: 'event_id,member_profile_id' });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    throw Error('Action inconnue.');
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Opération impossible.' }, { status: 400 });
  }
}
