import { memberContext } from '@/lib/member-portal';
import Link from 'next/link';

export default async function Messages() {
  const { s, m } = await memberContext();
  
  const { data } = await s
    .from('notification_inbox')
    .select('id, title, body, read_at, created_at')
    .eq('organization_member_id', m.id)
    .eq('organization_id', m.organization_id)
    .order('created_at', { ascending: false });

  return (
    <section>
      <header style={{ marginBottom: '2rem' }}>
        <Link href="/member" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none', marginBottom: '1rem' }}>
          ← Retour
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Mes Messages
        </h1>
        <p style={{ color: '#4b5563', marginTop: '0.5rem' }}>
          Toutes vos notifications et annonces.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data && data.length > 0 ? data.map((n) => {
          const isRead = !!n.read_at;

          return (
            <div key={n.id} style={{ backgroundColor: isRead ? '#ffffff' : '#f0f9ff', borderRadius: '1rem', padding: '1.25rem', border: `1px solid ${isRead ? '#e5e7eb' : '#bae6fd'}`, position: 'relative', overflow: 'hidden' }}>
              {!isRead && (
                <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', width: '0.5rem', height: '0.5rem', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
              )}
              <h3 style={{ fontSize: '1.05rem', fontWeight: isRead ? 500 : 600, color: '#111827', margin: '0 0 0.5rem 0', paddingRight: '1rem' }}>
                {n.title}
              </h3>
              <p style={{ color: '#4b5563', fontSize: '0.95rem', margin: '0 0 0.75rem 0', lineHeight: 1.5 }}>
                {n.body}
              </p>
              <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                {new Date(n.created_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
          );
        }) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px dashed #d1d5db' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#374151', margin: '0 0 0.5rem 0' }}>Aucun message</h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.9rem' }}>Votre boîte de réception est vide.</p>
          </div>
        )}
      </div>
    </section>
  );
}
