import Link from 'next/link';
import { memberContext } from '@/lib/member-portal';

export default async function MemberHome() {
  const { s, m, profile } = await memberContext();
  
  if (!profile) return (
    <section style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>Profil membre à relier</h1>
      <p style={{ color: '#4b5563' }}>Demandez à l’administrateur de rattacher votre compte utilisateur à votre fiche membre.</p>
    </section>
  );

  const [
    { data: contributions },
    { data: events },
    { data: notes }
  ] = await Promise.all([
    s.from('contributions').select('amount_due,amount_paid,status').eq('member_profile_id', profile.id).eq('organization_id', m.organization_id),
    s.from('event_invitations').select('id').eq('member_profile_id', profile.id).eq('organization_id', m.organization_id).in('status', ['pending', 'attending']),
    s.from('notification_inbox').select('id').eq('organization_member_id', m.id).is('read_at', null)
  ]);

  const due = (contributions ?? []).reduce((x, c) => x + Number(c.amount_due) - Number(c.amount_paid), 0);
  const cards = (profile as any).member_cards;
  const memberCard = Array.isArray(cards) ? cards[0] : cards;

  return (
    <section>
      <header style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {(m.organization as any)?.name}
        </p>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginTop: '0.5rem' }}>
          Bonjour {profile.first_name} 👋
        </h1>
        <p style={{ color: '#4b5563', marginTop: '0.5rem' }}>
          Voici un résumé de votre compte.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Contributions Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', backgroundColor: '#fef3c7', color: '#d97706', fontSize: '1.25rem' }}>💰</span>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', margin: 0 }}>À régler</h3>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            {due > 0 ? `${due.toLocaleString('fr-FR')} FCFA` : 'À jour'}
          </p>
          <Link href="/member/contributions" style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.875rem', color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>
            Voir mes cotisations →
          </Link>
        </div>

        {/* Events Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', backgroundColor: '#dbeafe', color: '#2563eb', fontSize: '1.25rem' }}>📅</span>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', margin: 0 }}>Événements</h3>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            {events?.length ?? 0}
          </p>
          <Link href="/member/events" style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.875rem', color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>
            Voir mon agenda →
          </Link>
        </div>

        {/* Messages Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', backgroundColor: '#e0e7ff', color: '#4f46e5', fontSize: '1.25rem' }}>✉️</span>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', margin: 0 }}>Messages non lus</h3>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            {notes?.length ?? 0}
          </p>
          <Link href="/member/messages" style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.875rem', color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>
            Ouvrir la messagerie →
          </Link>
        </div>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #071f4b, #0b3a6e 62%, #0e9f6e)', borderRadius: '1.25rem', padding: '1.25rem', color: 'white', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.25rem', overflow: 'hidden' }}>
        {memberCard?.front_image_url ? (
          <img src={memberCard.front_image_url} alt="Carte de membre" style={{ width: '100%', maxWidth: '430px', borderRadius: '1rem', boxShadow: '0 18px 40px rgba(0,0,0,.28)' }} />
        ) : (
          <div style={{ width: '100%', maxWidth: '430px', aspectRatio: '1.58', borderRadius: '1rem', background: 'rgba(255,255,255,.12)', display: 'grid', placeItems: 'center', border: '1px solid rgba(255,255,255,.22)' }}>
            <div style={{ textAlign: 'center' }}><img src="/icon.png" alt="" style={{ width: 56, height: 56 }} /><strong style={{ display: 'block', marginTop: 8 }}>{profile.first_name} {profile.last_name}</strong><small>Carte en préparation</small></div>
          </div>
        )}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Ma carte de membre</h2>
          <p style={{ color: '#dbeafe', margin: '0.6rem 0 1rem', maxWidth: '520px', lineHeight: 1.5 }}>Retrouvez ici votre carte numérique, son statut, son recto-verso et sa version téléchargeable.</p>
          <Link href="/member/card" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', color: '#0b3a6e', padding: '0.75rem 1.25rem', borderRadius: '0.7rem', fontWeight: 700, textDecoration: 'none' }}>💳 Ouvrir ma carte</Link>
        </div>
      </div>
    </section>
  );
}
