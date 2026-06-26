import { memberContext } from '@/lib/member-portal';
import Link from 'next/link';

export default async function Contributions() {
  const { s, m, profile } = await memberContext();
  
  if (!profile) return (
    <section style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>Profil membre non relié.</h1>
    </section>
  );

  const { data } = await s
    .from('contributions')
    .select('due_date, amount_due, amount_paid, status, plan:contribution_plans(name)')
    .eq('organization_id', m.organization_id)
    .eq('member_profile_id', profile.id)
    .order('due_date', { ascending: false });

  return (
    <section>
      <header style={{ marginBottom: '2rem' }}>
        <Link href="/member" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none', marginBottom: '1rem' }}>
          ← Retour
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Mes Cotisations
        </h1>
        <p style={{ color: '#4b5563', marginTop: '0.5rem' }}>
          Suivez l'état de vos cotisations et paiements.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data && data.length > 0 ? data.map((c, i) => {
          const isPaid = c.status === 'paid';
          const isPartial = c.status === 'partial';
          const isPending = c.status === 'pending';
          const badgeColor = isPaid ? '#10b981' : isPartial ? '#f59e0b' : '#ef4444';
          const badgeBg = isPaid ? '#d1fae5' : isPartial ? '#fef3c7' : '#fee2e2';
          const statusText = isPaid ? 'Payé' : isPartial ? 'Partiel' : 'En attente';

          return (
            <div key={i} style={{ backgroundColor: '#ffffff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 0.25rem 0' }}>
                  {(c.plan as any)?.name || 'Cotisation'}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Échéance : {new Date(c.due_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'inline-block', backgroundColor: badgeBg, color: badgeColor, fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '9999px', marginBottom: '0.5rem' }}>
                  {statusText}
                </span>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                  {c.amount_paid.toLocaleString('fr-FR')} / {c.amount_due.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            </div>
          );
        }) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px dashed #d1d5db' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🍃</span>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#374151', margin: '0 0 0.5rem 0' }}>Aucune cotisation</h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.9rem' }}>Vous n'avez aucune cotisation enregistrée pour le moment.</p>
          </div>
        )}
      </div>
    </section>
  );
}
