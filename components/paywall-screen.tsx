import Link from "next/link";

export function PaywallScreen() {
  const whatsappNumber = "2250757228731";
  const message = encodeURIComponent("Bonjour NAYOORA, j'ai effectué le paiement pour souscrire à mon plan, voici la preuve de transfert.");

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      padding: '20px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: '#fee2e2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '32px'
        }}>
          🔒
        </div>
        
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '16px'
        }}>
          Limite de plan atteinte
        </h1>
        
        <p style={{
          fontSize: '16px',
          color: '#4b5563',
          lineHeight: '1.5',
          marginBottom: '24px'
        }}>
          Vous avez dépassé la limite de votre offre actuelle. Pour continuer à gérer votre organisation et débloquer le tableau de bord, veuillez souscrire à un plan supérieur.
        </p>

        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Moyens de paiement acceptés
          </h3>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <span style={{ backgroundColor: '#ff6600', color: 'white', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>
              Orange Money
            </span>
            <span style={{ backgroundColor: '#00c6f5', color: 'white', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>
              Wave
            </span>
          </div>

          <p style={{ fontSize: '15px', color: '#1e293b', marginBottom: '4px' }}>
            Envoyez votre paiement au numéro :
          </p>
          <p style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', letterSpacing: '1px' }}>
            +225 07 57 22 87 31
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a
            href={`https://wa.me/${whatsappNumber}?text=${message}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              width: '100%',
              backgroundColor: '#25D366',
              color: 'white',
              padding: '14px 20px',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
              fontSize: '16px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#20bd5a'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#25D366'}
          >
            J'ai effectué le paiement
          </a>
          
          <Link
            href="/login"
            style={{
              display: 'block',
              width: '100%',
              backgroundColor: 'transparent',
              color: '#64748b',
              padding: '14px 20px',
              borderRadius: '8px',
              fontWeight: '500',
              textDecoration: 'none',
              fontSize: '15px',
              border: '1px solid #e2e8f0'
            }}
          >
            Retourner à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
