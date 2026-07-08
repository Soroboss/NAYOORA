import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/insforge/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { Calendar, Mail, CreditCard, Download } from "lucide-react";

export default async function PortalDashboard({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("member_session");
  
  if (!sessionCookie) {
    redirect(`/portal/${orgSlug}/login`);
  }

  const session = JSON.parse(sessionCookie.value);
  if (!session.memberId || !session.organizationId) {
    redirect(`/portal/${orgSlug}/login`);
  }

  const s = await createAdminClient();
  
  // Verify org matches session
  const { data: org } = await s.from("organizations").select("id, name, slug").eq("id", session.organizationId).single();
  if (!org || org.slug !== orgSlug) {
    // Session is for another org, clear it and redirect to login
    redirect(`/portal/${orgSlug}/login`);
  }

  const { data: profile } = await s.from("member_profiles")
    .select("id, first_name, last_name, email, phone, member_cards(id, status, front_image_url, back_image_url, pdf_url)")
    .eq("id", session.memberId)
    .single();

  if (!profile) {
    redirect(`/portal/${orgSlug}/login`);
  }

  const [
    { data: contributions },
    { data: events }
  ] = await Promise.all([
    s.from('contributions').select('amount_due,amount_paid,status').eq('member_profile_id', profile.id).eq('organization_id', org.id),
    s.from('event_invitations').select('id').eq('member_profile_id', profile.id).eq('organization_id', org.id).in('status', ['pending', 'attending'])
  ]);

  const due = (contributions ?? []).reduce((x, c) => x + Number(c.amount_due) - Number(c.amount_paid), 0);
  const cards = (profile as any).member_cards;
  const memberCard = Array.isArray(cards) ? cards[0] : cards;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Bonjour, {profile.first_name} 👋
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Bienvenue sur votre espace personnel {org.name}.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contributions Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <h3 className="font-semibold text-gray-700">Cotisations</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {due > 0 ? `${due.toLocaleString('fr-FR')} FCFA` : 'À jour'}
          </p>
          <p className="text-sm text-gray-500">
            {due > 0 ? 'Reste à payer' : 'Aucun retard'}
          </p>
        </div>

        {/* Events Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-700">Événements</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {events?.length ?? 0}
          </p>
          <p className="text-sm text-gray-500">Invitations en cours</p>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-700">Mes Informations</h3>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2"><span className="w-4">📞</span> {profile.phone || "Non renseigné"}</p>
            <p className="flex items-center gap-2"><span className="w-4">✉️</span> {profile.email || "Non renseigné"}</p>
          </div>
        </div>
      </div>

      {/* Member Card Area */}
      <div className="mt-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-400" />
              Carte de membre
            </h2>
            <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
              Votre carte numérique est disponible. Présentez son QR Code lors des événements de l'organisation pour un accès rapide.
            </p>
            
            {memberCard?.pdf_url && (
              <a href={memberCard.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                <Download className="w-5 h-5" />
                Télécharger la carte
              </a>
            )}
          </div>
          
          <div className="w-full max-w-sm shrink-0">
            {memberCard?.front_image_url ? (
              <img 
                src={memberCard.front_image_url} 
                alt="Ma carte de membre" 
                className="w-full rounded-2xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-300 border border-gray-700" 
              />
            ) : (
              <div className="w-full aspect-[1.58] bg-gray-800 rounded-2xl border border-gray-700 flex flex-col items-center justify-center text-gray-400 shadow-inner">
                <CreditCard className="w-12 h-12 mb-3 opacity-50" />
                <span className="font-medium">Aucune carte générée</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
