import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/insforge/server";
import { cookies } from "next/headers";
import { FileText, Download } from "lucide-react";

export default async function PortalDocuments({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("member_session");
  
  if (!sessionCookie) redirect(`/portal/${orgSlug}/login`);

  const session = JSON.parse(sessionCookie.value);
  if (!session.memberId || !session.organizationId) redirect(`/portal/${orgSlug}/login`);

  const s = await createAdminClient();
  
  const { data: org } = await s.from("organizations").select("id, slug").eq("id", session.organizationId).single();
  if (!org || org.slug !== orgSlug) redirect(`/portal/${orgSlug}/login`);

  const { data: documents } = await s
    .from("documents")
    .select("*")
    .eq("organization_id", org.id)
    .in("visibility", ["public", "members"])
    .order("created_at", { ascending: false });

  // Generate signed URLs for the documents
  const documentsWithUrls = await Promise.all((documents || []).map(async (doc: any) => {
    const { data } = await s.storage.from("organization-documents").createSignedUrl(doc.storage_path, 60 * 60);
    return { ...doc, url: data?.signedUrl };
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          Documents
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Consultez et téléchargez les documents importants de l'organisation.
        </p>
      </header>

      {documentsWithUrls.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-700">Aucun document disponible</p>
          <p className="text-sm">Les administrateurs n'ont partagé aucun document pour l'instant.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documentsWithUrls.map((doc: any) => (
            <div key={doc.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2" title={doc.title}>{doc.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <span className="bg-gray-100 px-2 py-1 rounded font-medium uppercase">{doc.mime_type?.split('/')[1] || 'Fichier'}</span>
                  {doc.size_bytes && <span>{(doc.size_bytes / 1024 / 1024).toFixed(2)} MB</span>}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 mt-auto">
                <a 
                  href={doc.url || "#"} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
