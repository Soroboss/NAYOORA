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
    <div className="min-h-screen bg-[#f7f9fc] py-12 px-4 sm:px-6 flex flex-col items-center justify-center font-sans">
      <div className="max-w-lg mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 sm:p-12">
          
          <div className="flex flex-col items-center text-center mb-10">
            {form.organization.logo_url ? (
              <img 
                src={form.organization.logo_url} 
                alt="Logo" 
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain mb-6 rounded-2xl shadow-sm border border-gray-50 bg-white" 
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-gray-100 to-gray-50 border border-gray-200 flex items-center justify-center text-4xl font-bold text-gray-400 mb-6 shadow-sm">
                {form.organization.name[0]}
              </div>
            )}
            <h2 className="text-sm font-semibold tracking-wide text-blue-600 uppercase mb-3">
              Rejoindre {form.organization.name}
            </h2>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {form.title}
            </h1>
            {form.description && (
              <p className="mt-4 text-gray-500 text-base sm:text-lg leading-relaxed max-w-sm">
                {form.description}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            {form.fields.map((field: any, index: number) => (
              <div key={index}>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                
                {field.type === 'file' ? (
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 group cursor-pointer">
                    <div className="space-y-2 text-center">
                      <svg className="mx-auto h-10 w-10 text-gray-400 group-hover:text-blue-500 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>{formData[field.name] ? 'Changer l\'image' : 'Sélectionner une photo'}</span>
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
                         {formData[field.name] ? formData[field.name].name : 'Format JPG, PNG (Max. 5Mo)'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <input
                    type={field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
                    required={field.required}
                    className="w-full rounded-2xl border-0 ring-1 ring-inset ring-gray-200 bg-gray-50 p-4 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 focus:bg-white transition-all text-base sm:text-lg"
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    placeholder={`Votre ${field.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white rounded-2xl py-4 px-8 font-bold text-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 active:translate-y-0"
              >
                {submitting ? 'Envoi en cours...' : 'Envoyer ma candidature'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="mt-8 text-center flex flex-col items-center justify-center opacity-60">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">Sécurisé & Propulsé par</p>
          <span className="text-sm font-bold text-gray-700 tracking-widest">NAYOORA</span>
        </div>
      </div>
    </div>
  );
}
