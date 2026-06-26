import { memberContext } from '@/lib/member-portal';
import Link from 'next/link';

export default async function Events() {
  const { s, m, profile } = await memberContext();
  
  if (!profile) return (
    <section style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>Profil membre non relié.</h1>
    </section>
  );

  const { data } = await s
    .from('event_invitations')
    .select('status, event:events(title, starts_at, location)')
    .eq('organization_id', m.organization_id)
    .eq('member_profile_id', profile.id);

  return (
    <section>
      <header style={{ marginBottom: '2rem' }}>
        <Link href="/member" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none', marginBottom: '1rem' }}>
          ← Retour
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Mes Événements
        </h1>
        <p style={{ color: '#4b5563', marginTop: '0.5rem' }}>
          Vos convocations et réunions à venir.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data && data.length > 0 ? data.map((a, i) => {
          const isAttending = a.status === 'attending';
          const isDeclined = a.status === 'declined';
          const isPending = a.status === 'pending';
          const badgeColor = isAttending ? '#10b981' : isDeclined ? '#ef4444' : '#f59e0b';
          const badgeBg = isAttending ? '#d1fae5' : isDeclined ? '#fee2e2' : '#fef3c7';
          const statusText = isAttending ? 'Présent' : isDeclined ? 'Absent' : 'En attente';

          return (
            <div key={i} style={{ backgroundColor: '#ffffff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  {(a.event as any)?.title || 'Réunion'}
                </h3>
                <span style={{ display: 'inline-block', backgroundColor: badgeBg, color: badgeColor, fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '9999px' }}>
                  {statusText}
                </span>
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🕒 {new Date((a.event as any)?.starts_at).toLocaleString('fr-FR')}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📍 {(a.event as any)?.location || 'Lieu à confirmer'}
                </span>
              </div>
            </div>
          );
        }) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px dashed #d1d5db' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📅</span>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#374151', margin: '0 0 0.5rem 0' }}>Aucun événement</h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.9rem' }}>Vous n'avez pas de convocation à venir.</p>
          </div>
        )}
      </div>
    </section>
  );
}
