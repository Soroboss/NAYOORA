'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/insforge/client';
import { useRouter } from 'next/navigation';

export default function RegistrationRequests({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const unwrappedParams = use(params);
  const organizationSlug = unwrappedParams.organizationSlug;

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const s = createClient();
  
  useEffect(() => {
    async function load() {
      const { data: org } = await s.from('organizations').select('id').eq('slug', organizationSlug).single();
      if (!org) return;
      setOrgId(org.id);
      
      const { data } = await s
        .from('registration_requests')
        .select('id, data, status, submitted_at, registration_form_id')
        .eq('organization_id', org.id)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });
        
      if (data) setRequests(data);
      setLoading(false);
    }
    load();
  }, [organizationSlug, s]);

  const handleApprove = async (request: any) => {
    if (!confirm(`Confirmez-vous l'adhésion de ${request.data.first_name} ${request.data.last_name} ?`)) return;
    
    // We update the request status to approved. A database trigger or RPC should ideally create the profile,
    // but for simplicity here we do it from the client if RLS allows, or we'd create an API route.
    // Let's create the profile here for now.
    
    try {
      // 1. Create member profile
      const { data: profile, error: profileError } = await s.from('member_profiles').insert({
        organization_id: orgId,
        first_name: request.data.first_name,
        last_name: request.data.last_name,
        phone: request.data.phone,
        email: request.data.email,
        member_number: `MEM-${Math.floor(1000 + Math.random() * 9000)}`
      }).select().single();

      if (profileError) throw profileError;

      // 2. Update request
      await s.from('registration_requests').update({
        status: 'approved',
        member_profile_id: profile.id,
        reviewed_at: new Date().toISOString()
      }).eq('id', request.id);

      // Remove from list
      setRequests(requests.filter(r => r.id !== request.id));
      alert('Membre ajouté avec succès !');
    } catch (e: any) {
      alert('Erreur lors de l\'approbation: ' + e.message);
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt("Raison du refus (optionnelle) :");
    if (reason === null) return;

    await s.from('registration_requests').update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_at: new Date().toISOString()
    }).eq('id', requestId);

    setRequests(requests.filter(r => r.id !== requestId));
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Demandes d'adhésion</h1>
      <p className="text-gray-600 mb-8">
        Gérez les formulaires d'inscription soumis par les futurs membres.
      </p>

      {requests.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-xl border border-dashed">
          <p className="text-gray-500">Aucune demande en attente.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map(req => (
            <div key={req.id} className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  {req.data.first_name} {req.data.last_name}
                </h3>
                <div className="text-sm text-gray-500 mt-1 flex gap-4">
                  <span>📞 {req.data.phone}</span>
                  {req.data.email && <span>✉️ {req.data.email}</span>}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Soumis le {new Date(req.submitted_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleReject(req.id)}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium text-sm"
                >
                  Refuser
                </button>
                <button 
                  onClick={() => handleApprove(req)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                >
                  Accepter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
