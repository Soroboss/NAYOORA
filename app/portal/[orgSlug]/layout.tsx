import { ReactNode } from "react";
import Link from "next/link";
import { LogOut, User, FileText, CreditCard } from "lucide-react";
import { cookies } from "next/headers";

export default async function PortalLayout({ children, params }: { children: ReactNode, params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  
  // Minimal navbar for the portal
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/portal/${orgSlug}`} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-gray-900 text-white flex items-center justify-center font-bold text-sm">
              {orgSlug.charAt(0).toUpperCase()}
            </div>
            <span className="font-bold text-gray-900 hidden sm:block uppercase tracking-wider text-sm">
              Espace Membre
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link href={`/portal/${orgSlug}`} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Profil</span>
            </Link>
            <Link href={`/portal/${orgSlug}/documents`} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Documents</span>
            </Link>
            <Link href={`/portal/${orgSlug}/logout`} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 ml-2">
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Déconnexion</span>
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
