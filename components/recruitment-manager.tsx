"use client";

import { useState } from 'react';

export function RecruitmentManager({ form, requests }: { form: any; requests: any[] }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  
  const defaultFields = [
    { name: 'firstName', label: 'Prénom', type: 'text', required: true },
    { name: 'lastName', label: 'Nom', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: false },
    { name: 'phone', label: 'Téléphone', type: 'text', required: true },
    { name: 'address', label: 'Adresse', type: 'text', required: false }
  ];

  const [isActive, setIsActive] = useState(form?.is_active ?? false);
  const [title, setTitle] = useState(form?.title || 'Formulaire d\\'inscription');
  const [description, setDescription] = useState(form?.description || '');
  const [fields, setFields] = useState<any[]>(form?.fields?.length ? form.fields : defaultFields);
  
  const publicLink = form?.id ? `${window.location.origin}/join/${form.id}` : '';

  async function saveForm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_form',
          title, description, fields, is_active: isActive, require_approval: true
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotice('Formulaire sauvegardé avec succès.');
      if (!form?.id) window.location.reload();
    } catch (err: any) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRequest(requestId: string, action: 'approve_request' | 'reject_request') {
    setBusy(true);
    try {
      const res = await fetch('/api/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, requestId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="finance-workspace">
      <div className="finance-forms">
        <form className="panel compact-form" onSubmit={saveForm}>
          <p className="eyebrow">Configuration</p>
          <h2>Paramètres du formulaire</h2>
          
          <label className="check-line" style={{ marginBottom: '1rem' }}>
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> 
            <b>Activer le formulaire d'inscription public</b>
          </label>

          <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Titre du formulaire" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description ou message de bienvenue" rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          
          {publicLink && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Lien à partager :</p>
              <a href={publicLink} target="_blank" rel="noreferrer" style={{ fontWeight: 'bold', color: '#1e40af' }}>{publicLink}</a>
            </div>
          )}

          <button disabled={busy} type="submit" className="button button-dark" style={{ marginTop: '1rem' }}>
            Sauvegarder le formulaire
          </button>
          {notice && <p style={{ color: '#10b981', marginTop: '1rem', fontWeight: 'bold' }}>{notice}</p>}
        </form>
      </div>

      <article className="panel">
        <p className="eyebrow">Demandes</p>
        <h2>Nouvelles inscriptions</h2>
        {requests.length === 0 ? (
          <p style={{ color: '#64748b' }}>Aucune demande en attente.</p>
        ) : (
          <div className="finance-list">
            {requests.map(req => (
              <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <b style={{ display: 'block', fontSize: '1.1rem' }}>{req.data.firstName} {req.data.lastName}</b>
                  <small style={{ color: '#64748b' }}>{req.data.phone} • {req.data.email}</small>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>{req.data.address}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleRequest(req.id, 'reject_request')} disabled={busy} className="button button-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }}>Refuser</button>
                  <button onClick={() => handleRequest(req.id, 'approve_request')} disabled={busy} className="button button-dark" style={{ background: '#10b981' }}>Valider & Créer le membre</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
