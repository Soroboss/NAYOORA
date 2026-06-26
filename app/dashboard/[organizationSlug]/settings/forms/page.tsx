'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/insforge/client';

export default function RegistrationFormsSettings({ params }: { params: { organizationSlug: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const s = createClient();
  
  useEffect(() => {
    async function load() {
      const { data: org } = await s.from('organizations').select('id').eq('slug', params.organizationSlug).single();
      if (!org) return;
      setOrgId(org.id);
      
      const { data: existingForm } = await s.from('registration_forms').select('*').eq('organization_id', org.id).maybeSingle();
      if (existingForm) {
        setForm(existingForm);
      } else {
        // Default form state
        setForm({
          organization_id: org.id,
          title: 'Formulaire d\'inscription',
          description: 'Remplissez ce formulaire pour soumettre votre demande d\'adhésion.',
          fields: [
            { name: 'first_name', label: 'Prénom', type: 'text', required: true },
            { name: 'last_name', label: 'Nom', type: 'text', required: true },
            { name: 'phone', label: 'Numéro de téléphone', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: false },
          ],
          is_active: true,
          require_approval: true
        });
      }
      setLoading(false);
    }
    load();
  }, [params.organizationSlug, s]);

  const handleSave = async () => {
    if (!orgId) return;
    setLoading(true);
    
    if (form.id) {
      await s.from('registration_forms').update(form).eq('id', form.id);
    } else {
      const { data: newForm } = await s.from('registration_forms').insert(form).select().single();
      if (newForm) setForm(newForm);
    }
    
    setLoading(false);
    alert('Formulaire sauvegardé avec succès.');
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  const publicLink = form?.id ? `${window.location.origin}/join/${form.id}` : null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Formulaire d'inscription public</h1>
      <p className="text-gray-600 mb-8">
        Configurez le formulaire que les futurs membres rempliront pour demander à rejoindre votre organisation.
      </p>

      {publicLink && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">Lien public</h3>
            <p className="text-blue-700 text-sm">{publicLink}</p>
          </div>
          <button 
            onClick={() => { navigator.clipboard.writeText(publicLink); alert('Lien copié !'); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Copier le lien
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Titre du formulaire</label>
          <input 
            type="text" 
            className="w-full border rounded-lg p-2"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Description (optionnelle)</label>
          <textarea 
            className="w-full border rounded-lg p-2"
            rows={3}
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="is_active"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          <label htmlFor="is_active" className="text-sm font-medium">Activer ce formulaire (Le rendre public)</label>
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-2">Champs du formulaire</h3>
          <p className="text-sm text-gray-500 mb-4">Pour l'instant, les champs de base (Nom, Prénom, Téléphone, Email) sont activés par défaut.</p>
          
          <div className="space-y-2">
            {form.fields.map((field: any, index: number) => (
              <div key={index} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border">
                <span className="font-medium text-gray-700">{field.label}</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">{field.type}</span>
                {field.required && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Requis</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            Enregistrer le formulaire
          </button>
        </div>
      </div>
    </div>
  );
}
