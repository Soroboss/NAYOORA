import { createAdminClient } from '@/lib/insforge/server';
import { notFound } from 'next/navigation';

export default async function VerifyCardPage({ params }: { params: Promise<{ qrToken: string }> }) {
  const { qrToken } = await params;

  if (!qrToken) return notFound();

  const insforge = await createAdminClient();
  const { data: card, error } = await insforge
    .from('member_cards')
    .select('*, member_profiles(*, organizations(name, logo_url))')
    .eq('qr_token', qrToken)
    .single();

  if (error || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ❌
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Carte Invalide</h1>
          <p className="text-gray-600">Cette carte n'existe pas ou le QR code est falsifié.</p>
        </div>
      </div>
    );
  }

  if (card.status === 'blocked') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow max-w-md text-center border-t-4 border-red-500">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ⚠️
          </div>
          <h1 className="text-2xl font-bold text-red-700 mb-2">Carte Désactivée</h1>
          <p className="text-gray-600">Cette carte a été désactivée par l'administration. Elle n'est plus valide pour accéder aux services.</p>
        </div>
      </div>
    );
  }

  const member = card.member_profiles;
  const isExpired = card.expires_at ? new Date(card.expires_at) < new Date() : false;
  const isSuspended = member.status !== 'active';
  
  let statusBadge = (
    <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium border border-green-200">
      <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
      Actif
    </div>
  );

  if (isSuspended) {
    statusBadge = (
       <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium border border-red-200">
        <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
        Membre Suspendu
      </div>
    );
  } else if (isExpired) {
    statusBadge = (
       <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium border border-yellow-200">
        <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
        Expiré
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg max-w-md w-full border border-gray-100 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gray-900 opacity-5"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          {member.organizations?.logo_url && (
            <img src={member.organizations.logo_url} alt="Logo" className="h-16 w-auto mb-4" />
          )}
          <h1 className="text-xl font-bold text-gray-900 mb-6 text-center">{member.organizations?.name}</h1>

          <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow mb-4">
            <img 
              src={member.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${member.full_name}`} 
              alt="Membre" 
              className="w-full h-full object-cover" 
            />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center">{member.full_name}</h2>
          <p className="text-gray-500 text-center mb-4">{member.job_title || 'Membre'}</p>

          <div className="mb-6">
            {statusBadge}
          </div>

          <div className="w-full space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">N° de carte</span>
              <span className="font-semibold text-gray-900 text-sm">{card.card_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Validée le</span>
              <span className="font-semibold text-gray-900 text-sm">{new Date(card.issued_at).toLocaleDateString()}</span>
            </div>
            {card.expires_at && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Expire le</span>
                <span className="font-semibold text-gray-900 text-sm">{new Date(card.expires_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">Vérifié par la plateforme NAYOORA</p>
        </div>
      </div>
    </div>
  );
}
