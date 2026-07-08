"use client";

import { useState, ChangeEvent } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function DocumentsManager({ documents, canManage, orgId }: { documents: any[]; canManage: boolean; orgId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("members");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!title) {
      toast.error("Veuillez saisir un titre avant de choisir un fichier.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 10 MB).");
      event.target.value = "";
      return;
    }

    setUploading(true);
    setNotice("Téléchargement du fichier en cours...");

    try {
      const { createClient } = await import("@/lib/insforge/client");
      const client = createClient();
      
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `organizations/${orgId}/docs/${crypto.randomUUID()}-${safeName}`;
      
      const bucket = client.storage.from("organization-documents");
      
      const { data, error } = await bucket.upload(path, file, { 
        contentType: file.type,
        upsert: false
      });
      
      if (error) throw error;
      
      const publicUrl = bucket.getPublicUrl(path).data.publicUrl;

      // Now insert record in db via API
      const r = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          storage_path: publicUrl,
          mime_type: file.type,
          size_bytes: file.size,
          visibility,
        }),
      });

      const d = await r.json();
      if (!r.ok) throw new Error(d.error);

      toast.success("Document ajouté avec succès !");
      setTitle("");
      setNotice("");
      router.refresh();
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erreur lors de l'upload du document.");
      setNotice("Erreur.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Voulez-vous vraiment supprimer ce document ?")) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast.success("Document supprimé.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Erreur de suppression.");
    } finally {
      setBusy(false);
    }
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <div className="finance-workspace">
      
      {canManage && (
        <div className="finance-forms">
          <div className="panel compact-form">
            <p className="eyebrow">Ajouter</p>
            <h2>Nouveau Document</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
              <input 
                required 
                placeholder="Titre du document (ex: PV Assemblée Générale 2024)" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                disabled={uploading}
              />
              <select value={visibility} onChange={(e) => setVisibility(e.target.value)} disabled={uploading}>
                <option value="members">Visible par tous les membres</option>
                <option value="managers">Visible uniquement par le bureau</option>
              </select>
              <label className="button button-dark" style={{ textAlign: "center", cursor: "pointer", opacity: uploading ? 0.7 : 1 }}>
                {uploading ? "Envoi en cours..." : "Choisir un fichier et Envoyer"}
                <input 
                  type="file" 
                  style={{ display: "none" }} 
                  onChange={handleFileChange} 
                  disabled={uploading}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                />
              </label>
              {notice && <p style={{ fontSize: "12px", color: "#6b7280", textAlign: "center", marginTop: "4px" }}>{notice}</p>}
            </div>
          </div>
        </div>
      )}

      <article className="panel" style={{ flex: 1 }}>
        <p className="eyebrow">Archives</p>
        <h2>Documents de l'organisation</h2>
        <div className="finance-list" style={{ marginTop: "16px" }}>
          {documents.map((doc) => (
            <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "12px" }}>
              <div>
                <b style={{ display: "block", fontSize: "16px" }}>{doc.title}</b>
                <small style={{ color: "#6b7280", display: "block", marginTop: "4px" }}>
                  Ajouté le {new Date(doc.created_at).toLocaleDateString("fr-FR")} · {formatBytes(doc.size_bytes)} · {doc.visibility === 'members' ? 'Public (Membres)' : 'Privé (Bureau)'}
                </small>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <a href={doc.storage_path} target="_blank" rel="noreferrer" className="button" style={{ padding: "8px 12px", fontSize: "14px" }}>
                  Ouvrir
                </a>
                {canManage && (
                  <button onClick={() => handleDelete(doc.id)} disabled={busy} className="button" style={{ padding: "8px 12px", fontSize: "14px", color: "#dc2626", borderColor: "#fca5a5" }}>
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
          {!documents.length && (
            <div style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>
              Aucun document archivé pour le moment.
            </div>
          )}
        </div>
      </article>

    </div>
  );
}
