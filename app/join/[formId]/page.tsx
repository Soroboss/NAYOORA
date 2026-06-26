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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="bg-black text-white p-8 text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Rejoindre l'organisation
            </h2>
            <h1 className="text-2xl font-bold">{form.organization.name}</h1>
          </div>
          
          <div className="p-8">
            <h3 className="text-xl font-bold mb-2 text-gray-900">{form.title}</h3>
            {form.description && (
              <p className="text-gray-600 mb-8 whitespace-pre-line">{form.description}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {form.fields.map((field: any, index: number) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'file' ? (
                    <input
                      type="file"
                      accept="image/*"
                      required={field.required}
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:border-black focus:ring-black border p-2 text-sm"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setFormData({ ...formData, [field.name]: file });
                      }}
                    />
                  ) : (
                    <input
                      type={field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
                      required={field.required}
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:border-black focus:ring-black border p-3"
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      placeholder={`Votre ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
              
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black text-white rounded-lg py-3 font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Envoi en cours...' : 'Soumettre ma demande'}
              </button>
            </form>
          </div>
        </div>
        <p className="text-center text-sm text-gray-400 mt-6">
          Propulsé par NAYOORA
        </p>
      </div>
    </div>
  );
}
