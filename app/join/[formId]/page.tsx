'use client';

import { useState, useEffect, use } from 'react';

export default function JoinFormPage({ params }: { params: Promise<{ formId: string }> }) {
  const unwrappedParams = use(params);
  const formId = unwrappedParams.formId;

  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/public/forms/${formId}`);
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || 'Erreur inconnue');
        } else {
          setForm(data.form);
        }
      } catch (err) {
        setError('Erreur de connexion');
      }
      setLoading(false);
    }
    load();
  }, [formId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const dataToSubmit = { ...formData };
      
      // Handle file uploads (Base64 conversion for simplicity on public forms)
      for (const field of form.fields) {
        if (field.type === 'file' && dataToSubmit[field.name] instanceof File) {
          const file = dataToSubmit[field.name];
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
          dataToSubmit[field.name] = base64; // Store base64 in jsonb
        }
      }

      const res = await fetch(`/api/public/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          data: dataToSubmit
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Erreur lors de la soumission');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      alert('Erreur réseau');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Chargement du formulaire...</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-md w-full text-center">
          <span className="text-4xl mb-4 block">🚫</span>
          <h1 className="text-xl font-bold mb-2">Formulaire indisponible</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-md w-full text-center">
          <span className="text-4xl mb-4 block">✅</span>
          <h1 className="text-2xl font-bold mb-2 text-green-700">Demande envoyée !</h1>
          <p className="text-gray-600">
            Votre demande d'adhésion a été transmise à <strong>{form.organization.name}</strong> avec succès. Vous serez contacté prochainement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4 sm:px-6 flex flex-col justify-center">
      <div className="max-w-xl mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8 sm:p-10 text-center relative">
            {form.organization.logo_url ? (
              <img src={form.organization.logo_url} alt="Logo" className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full object-cover border-4 border-white/10 shadow-2xl mb-4" />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-gray-800 border-4 border-gray-700 flex items-center justify-center text-3xl font-bold mb-4 shadow-2xl">
                {form.organization.name[0]}
              </div>
            )}
            <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Rejoindre l'organisation
            </h2>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-white">{form.organization.name}</h1>
          </div>
          
          <div className="p-6 sm:p-10">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900">{form.title}</h3>
            {form.description && (
              <p className="text-gray-600 mb-8 whitespace-pre-line text-sm sm:text-base leading-relaxed">{form.description}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {form.fields.map((field: any, index: number) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'file' ? (
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-2xl hover:border-gray-400 transition-colors bg-gray-50/50">
                      <div className="space-y-2 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                            <span>{formData[field.name] ? 'Changer de fichier' : 'Télécharger un fichier'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              required={field.required && !formData[field.name]}
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setFormData({ ...formData, [field.name]: file });
                              }}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                           {formData[field.name] ? formData[field.name].name : 'PNG, JPG (Photo pour la carte)'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <input
                      type={field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
                      required={field.required}
                      className="w-full border-gray-300 rounded-2xl shadow-sm focus:border-black focus:ring-black border p-4 text-gray-900 bg-gray-50/50 hover:bg-white transition-colors text-base"
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      placeholder={`Saisissez ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
              
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-black text-white rounded-2xl py-4 font-semibold text-lg hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                >
                  {submitting ? 'Envoi en cours...' : 'Soumettre ma demande'}
                </button>
              </div>
            </form>
          </div>
        </div>
        <p className="text-center text-xs sm:text-sm text-gray-400 mt-8 mb-4">
          Propulsé de manière sécurisée par <strong>NAYOORA</strong>
        </p>
      </div>
    </div>
  );
}
