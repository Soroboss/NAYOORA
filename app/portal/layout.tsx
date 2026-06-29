import "@/app/globals.css";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient as createClient } from "@/lib/insforge/server";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const portalSession = cookieStore.get("portal_session")?.value;

  return (
    <div className="portal-shell">
      <nav className="portal-nav">
        <Link href="/portal" className="brand">
          <img src="/nayoora-logo.png" alt="" /> NAYOORA Espace Membre
        </Link>
        {portalSession && (
          <div className="portal-nav-links">
            <Link href="/portal">Mon Profil</Link>
            <Link href="/portal/finance">Mes Cotisations</Link>
            <Link href="/portal/tontine">Ma Tontine</Link>
            <Link href="/portal/chat">Messagerie</Link>
            <Link href="/portal/organigramme">Organigramme</Link>
            <Link href="/api/portal/auth/logout" style={{ color: "#ef4444" }}>Déconnexion</Link>
          </div>
        )}
      </nav>
      <main className="portal-main">
        {children}
      </main>
      
      <style>{`
        .portal-shell { min-height: 100vh; background: #f9fafb; font-family: sans-serif; }
        .portal-nav { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: white; border-bottom: 1px solid #e5e7eb; }
        .portal-nav .brand { display: flex; align-items: center; gap: 12px; font-weight: 700; color: #111827; text-decoration: none; font-size: 1.1rem; }
        .portal-nav .brand img { width: 32px; height: 32px; border-radius: 6px; }
        .portal-nav-links { display: flex; gap: 16px; align-items: center; }
        .portal-nav-links a { color: #4b5563; text-decoration: none; font-weight: 500; font-size: 0.9rem; }
        .portal-nav-links a:hover { color: #111827; }
        .portal-main { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
        @media (max-width: 640px) {
          .portal-nav { flex-direction: column; gap: 16px; }
          .portal-nav-links { width: 100%; justify-content: space-between; overflow-x: auto; padding-bottom: 8px; }
        }
      `}</style>
    </div>
  );
}
