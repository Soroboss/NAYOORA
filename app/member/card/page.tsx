import { memberContext } from '@/lib/member-portal';
import Link from 'next/link';

export default async function Card() {
  const { s, m, profile } = await memberContext();
  
  if (!profile) return (
    <section style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>Profil membre non relié.</h1>
    </section>
  );

  const { data } = await s
    .from('member_cards')
    .select('card_number, status, qr_token, expires_at')
    .eq('organization_id', m.organization_id)
    .eq('member_profile_id', profile.id)
    .maybeSingle();

  return (
    <section>
      <header style={{ marginBottom: '2rem' }}>
        <Link href="/member" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none', marginBottom: '1rem' }}>
          ← Retour
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Carte de Membre
        </h1>
        <p style={{ color: '#4b5563', marginTop: '0.5rem' }}>
          Présentez cette carte numérique lors des événements.
        </p>
      </header>

      {data ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
          {/* Card Design */}
          <div style={{ 
            width: '100%', 
            maxWidth: '380px', 
            aspectRatio: '1.586 / 1', 
            background: 'linear-gradient(135deg, #111827 0%, #374151 100%)', 
            borderRadius: '1rem', 
            padding: '1.5rem', 
            color: 'white', 
            position: 'relative', 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            {/* Background pattern (optional) */}
            <div style={{ position: 'absolute', top: '-50%', right: '-50%', width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)', transform: 'rotate(30deg)' }}></div>
            
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Organisation</p>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>{(m.organization as any)?.name}</h3>
              </div>
              <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                O
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 10 }}>
              <p style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Membre</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt="Photo" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', border: '2px solid rgba(255,255,255,0.2)' }}>
                    👤
                  </div>
                )}
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{profile.first_name} {profile.last_name}</h2>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#d1d5db', fontFamily: 'monospace' }}>{data.card_number}</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', maxWidth: '380px', backgroundColor: '#ffffff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <p style={{ margin: '0 0 1rem 0', color: '#4b5563', fontSize: '0.875rem' }}>Faites scanner ce QR Code par un administrateur pour valider votre présence.</p>
            {/* Fake QR Code Placeholder */}
            <div style={{ width: '160px', height: '160px', margin: '0 auto 1.5rem auto', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <div style={{ width: '100%', height: '100%', backgroundImage: 'repeating-linear-gradient(45deg, #111827 25%, transparent 25%, transparent 75%, #111827 75%, #111827), repeating-linear-gradient(45deg, #111827 25%, transparent 25%, transparent 75%, #111827 75%, #111827)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px', opacity: 0.1 }}></div>
            </div>
            
            <Link href={`/card/${data.qr_token}`} target="_blank" style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '0.875rem', backgroundColor: '#111827', color: 'white', borderRadius: '0.5rem', fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none' }}>
              Ouvrir le lecteur complet
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px dashed #d1d5db' }}>
          <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>⏳</span>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#374151', margin: '0 0 0.5rem 0' }}>Carte non émise</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '0.9rem' }}>Votre carte numérique n'a pas encore été générée par l'organisation.</p>
        </div>
      )}
    </section>
  );
}
