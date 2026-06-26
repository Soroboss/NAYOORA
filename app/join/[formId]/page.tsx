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
      
      for (const field of form.fields) {
        if (field.type === 'file' && dataToSubmit[field.name] instanceof File) {
          const file = dataToSubmit[field.name];
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
          dataToSubmit[field.name] = base64;
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
      <div className="join-page center-message">
        <p>Chargement du formulaire...</p>
        <style jsx>{`
          .join-page { min-height: 100vh; background: #f7f9fc; display: flex; align-items: center; justify-content: center; font-family: Poppins, sans-serif; }
          .center-message { color: #64748b; font-size: 15px; }
        `}</style>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="join-page center-message">
        <div className="status-card">
          <span className="status-icon">🚫</span>
          <h1>Formulaire indisponible</h1>
          <p>{error}</p>
        </div>
        <style jsx>{`
          .join-page { min-height: 100vh; background: #f7f9fc; display: flex; align-items: center; justify-content: center; font-family: Poppins, sans-serif; padding: 20px; }
          .status-card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); text-align: center; max-width: 400px; width: 100%; border: 1px solid #eaeaea; }
          .status-icon { font-size: 40px; display: block; margin-bottom: 20px; }
          h1 { margin: 0 0 10px; font-size: 22px; color: #0f172a; }
          p { margin: 0; color: #64748b; }
        `}</style>
      </div>
    );
  }

  if (success) {
    return (
      <div className="join-page center-message">
        <div className="status-card">
          <span className="status-icon">✅</span>
          <h1 className="success-title">Demande envoyée !</h1>
          <p>
            Votre demande d'adhésion a été transmise à <strong>{form.organization.name}</strong> avec succès. Vous serez contacté prochainement.
          </p>
        </div>
        <style jsx>{`
          .join-page { min-height: 100vh; background: #f7f9fc; display: flex; align-items: center; justify-content: center; font-family: Poppins, sans-serif; padding: 20px; }
          .status-card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); text-align: center; max-width: 400px; width: 100%; border: 1px solid #eaeaea; }
          .status-icon { font-size: 40px; display: block; margin-bottom: 20px; }
          h1 { margin: 0 0 10px; font-size: 22px; color: #0f172a; }
          .success-title { color: #16a34a; }
          p { margin: 0; color: #64748b; line-height: 1.6; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="join-page">
      <div className="join-container">
        
        <div className="join-header">
          {form.organization.logo_url ? (
            <img 
              src={form.organization.logo_url} 
              alt="Logo" 
              className="org-logo" 
            />
          ) : (
            <div className="org-logo-placeholder">
              {form.organization.name[0]}
            </div>
          )}
          <h2 className="join-subtitle">
            Rejoindre {form.organization.name}
          </h2>
          <h1 className="join-title">
            {form.title}
          </h1>
          {form.description && (
            <p className="join-description">
              {form.description}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="join-form">
          {form.fields.map((field: any, index: number) => (
            <div key={index} className="form-group">
              <label className="form-label">
                {field.label} {field.required && <span className="required">*</span>}
              </label>
              
              {field.type === 'file' ? (
                <div className="file-upload">
                  <span className="file-icon">🖼️</span>
                  <label className="file-action">
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
                  <p className="file-hint">
                     {formData[field.name] ? formData[field.name].name : 'Format JPG, PNG (Max. 5Mo)'}
                  </p>
                </div>
              ) : (
                <input
                  type={field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
                  required={field.required}
                  className="form-input"
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  placeholder={`Votre ${field.label.toLowerCase()}`}
                />
              )}
            </div>
          ))}
          
          <div className="form-submit">
            <button
              type="submit"
              disabled={submitting}
              className="submit-button"
            >
              {submitting ? 'Envoi en cours...' : 'Envoyer ma candidature'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="join-footer">
        <p>Sécurisé & Propulsé par</p>
        <span>NAYOORA</span>
      </div>

      <style jsx>{`
        .join-page {
          min-height: 100vh;
          background: #f7f9fc;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          font-family: Poppins, sans-serif;
        }
        .join-container {
          background: #fff;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.04);
          border: 1px solid #f1f5f9;
          max-width: 500px;
          width: 100%;
        }
        .join-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 40px;
        }
        .org-logo {
          width: 100px;
          height: 100px;
          object-fit: contain;
          margin-bottom: 24px;
          border-radius: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          background: white;
          border: 1px solid #f8fafc;
        }
        .org-logo-placeholder {
          width: 100px;
          height: 100px;
          border-radius: 20px;
          background: linear-gradient(135deg, #f1f5f9, #f8fafc);
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          font-weight: bold;
          color: #94a3b8;
          margin-bottom: 24px;
        }
        .join-subtitle {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #2563eb;
          text-transform: uppercase;
          margin: 0 0 12px 0;
        }
        .join-title {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
          margin: 0;
          letter-spacing: -0.5px;
        }
        .join-description {
          margin: 16px 0 0 0;
          color: #64748b;
          font-size: 15px;
          line-height: 1.6;
        }
        .join-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }
        .required {
          color: #ef4444;
        }
        .form-input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          font-size: 15px;
          font-family: inherit;
          color: #0f172a;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .form-input:focus {
          outline: none;
          border-color: #2563eb;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .form-input::placeholder {
          color: #94a3b8;
        }
        .file-upload {
          border: 2px dashed #cbd5e1;
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          background: #f8fafc;
          transition: all 0.2s ease;
        }
        .file-upload:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
        }
        .file-icon {
          font-size: 28px;
          display: block;
          margin-bottom: 12px;
        }
        .file-action {
          display: inline-block;
          font-weight: 600;
          color: #2563eb;
          cursor: pointer;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .file-action:hover {
          text-decoration: underline;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        .file-hint {
          margin: 0;
          font-size: 12px;
          color: #64748b;
        }
        .form-submit {
          margin-top: 16px;
        }
        .submit-button {
          width: 100%;
          padding: 16px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(37,99,235,0.3);
        }
        .submit-button:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37,99,235,0.4);
        }
        .submit-button:active:not(:disabled) {
          transform: translateY(0);
        }
        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .join-footer {
          margin-top: 32px;
          text-align: center;
          opacity: 0.7;
        }
        .join-footer p {
          margin: 0 0 4px 0;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .join-footer span {
          font-size: 14px;
          font-weight: 800;
          color: #334155;
          letter-spacing: 2px;
        }
        
        @media (max-width: 600px) {
          .join-page {
            padding: 20px 15px;
          }
          .join-container {
            padding: 30px 20px;
          }
          .join-title {
            font-size: 26px;
          }
          .org-logo {
            width: 80px;
            height: 80px;
            margin-bottom: 20px;
          }
          .org-logo-placeholder {
            width: 80px;
            height: 80px;
            font-size: 32px;
            margin-bottom: 20px;
          }
        }
      `}</style>
    </div>
  );
}

