import { ImageResponse } from '@vercel/og';

interface CardData {
  member: {
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    role: string;
    status: string;
    memberNumber: string;
    expiresAt: string | null;
  };
  organization: {
    name: string;
    logoUrl: string | null;
    address: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
  };
  qrCodeDataUri: string;
}

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

export async function renderFrontCard(data: CardData): Promise<ArrayBuffer> {
  const { member, organization, colors, qrCodeDataUri } = data;
  const photo = member.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.firstName + ' ' + member.lastName)}&background=random&size=400`;
  const logo = organization.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(organization.name)}&background=fff&color=000&size=200`;

  const element = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Header Background */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '35%',
          backgroundColor: colors.primary,
          width: '100%',
          padding: '40px',
        }}
      >
        <img src={logo} alt="Logo" style={{ maxHeight: '120px', objectFit: 'contain' }} />
        <h1 style={{ color: '#ffffff', fontSize: '50px', marginTop: '20px', textAlign: 'center' }}>
          {organization.name}
        </h1>
      </div>

      {/* Body */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          padding: '60px',
        }}
      >
        <img
          src={photo}
          style={{
            width: '300px',
            height: '300px',
            borderRadius: '150px',
            border: `10px solid ${colors.secondary}`,
            objectFit: 'cover',
            marginTop: '-150px',
            backgroundColor: '#fff',
          }}
        />

        <h2 style={{ fontSize: '70px', fontWeight: 'bold', color: '#111827', margin: '40px 0 10px 0' }}>
          {member.firstName} {member.lastName}
        </h2>
        <h3 style={{ fontSize: '40px', color: colors.primary, margin: '0 0 40px 0' }}>
          {member.role || 'Membre'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between', padding: '0 40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '30px', color: '#6b7280' }}>Numéro</span>
            <span style={{ fontSize: '45px', fontWeight: 'bold', color: '#111827' }}>{member.memberNumber || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '30px', color: '#6b7280' }}>Statut</span>
            <span style={{ fontSize: '45px', fontWeight: 'bold', color: member.status === 'active' ? '#10b981' : '#ef4444' }}>
              {member.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '15%',
          backgroundColor: '#f3f4f6',
          width: '100%',
          padding: '0 60px',
          borderTop: `10px solid ${colors.secondary}`
        }}
      >
        <img src={qrCodeDataUri} alt="QR Code" style={{ width: '150px', height: '150px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
           <span style={{ fontSize: '24px', color: '#6b7280' }}>Scan to verify</span>
           <span style={{ fontSize: '30px', color: '#111827', fontWeight: 'bold' }}>Valid until {member.expiresAt ? new Date(member.expiresAt).toLocaleDateString() : 'Indefinite'}</span>
        </div>
      </div>
    </div>
  );

  const response = new ImageResponse(element, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  });

  return await response.arrayBuffer();
}

export async function renderBackCard(data: CardData): Promise<ArrayBuffer> {
  const { organization, colors, qrCodeDataUri } = data;
  const logo = organization.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(organization.name)}&background=fff&color=000&size=200`;

  const element = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: '#ffffff',
        fontFamily: 'sans-serif',
        padding: '80px',
        border: `20px solid ${colors.primary}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '60px' }}>
         <img src={logo} alt="Logo" style={{ maxHeight: '150px', opacity: 0.8 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
        <h2 style={{ fontSize: '50px', color: colors.primary, textAlign: 'center', marginBottom: '40px' }}>
          {organization.name}
        </h2>
        
        <p style={{ fontSize: '32px', color: '#4b5563', textAlign: 'center', lineHeight: 1.5, marginBottom: '80px' }}>
          Cette carte est la propriété de l'organisation. Elle est strictement personnelle et ne peut être prêtée. En cas de perte, veuillez la retourner à l'adresse indiquée ci-dessous.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          {organization.address && <span style={{ fontSize: '30px', color: '#111827' }}>📍 {organization.address}</span>}
          {organization.email && <span style={{ fontSize: '30px', color: '#111827' }}>✉️ {organization.email}</span>}
          {organization.phone && <span style={{ fontSize: '30px', color: '#111827' }}>📞 {organization.phone}</span>}
          {organization.website && <span style={{ fontSize: '30px', color: '#111827' }}>🌐 {organization.website}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto' }}>
        <img src={qrCodeDataUri} alt="QR Code" style={{ width: '200px', height: '200px' }} />
      </div>
    </div>
  );

  const response = new ImageResponse(element, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  });

  return await response.arrayBuffer();
}
