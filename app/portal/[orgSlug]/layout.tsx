import "@/app/globals.css";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient as createClient } from "@/lib/insforge/server";

export default async function PortalLayout(props: { children: React.ReactNode, params: Promise<{ orgSlug: string }> }) {
  const { children } = props;
  const params = await props.params;
  const cookieStore = await cookies();
  const portalSession = cookieStore.get("portal_session")?.value;
  const insforge = await createClient();

  // Fetch organization details for the header
  const { data: org } = await insforge
    .from("organizations")
    .select("name, logo_url, organization_type")
    .eq("slug", params.orgSlug)
    .single();

  const orgName = org?.name || "Espace Membre";
  // The logo_url could be a full URL, a path, or null
  const logoUrl = org?.logo_url ? org.logo_url : "/nayoora-logo.png";
  const hasTontine = org?.organization_type === "tontine" || org?.organization_type === "cooperative";

  return (
    <div className="portal-shell">
      <nav className="portal-nav">
        <Link href={`/portal/${params.orgSlug}`} className="brand">
          <img src={logoUrl} alt="" /> {orgName}
        </Link>
        {portalSession && (
          <div className="portal-nav-links">
            <Link href={`/portal/${params.orgSlug}`}><span>⌂</span><b>Accueil</b></Link>
            <Link href={`/portal/${params.orgSlug}/finance`}><span>₣</span><b>Cotisations</b></Link>
            {hasTontine && <Link className="portal-tontine-link" href={`/portal/${params.orgSlug}/tontine`}><span>↻</span><b>Tontine</b></Link>}
            <Link href={`/portal/${params.orgSlug}/chat`}><span>✉</span><b>Messages</b></Link>
            <Link href={`/portal/${params.orgSlug}/organigramme`}><span>♙</span><b>Bureau</b></Link>
            <a className="portal-logout" href="/api/portal/auth/logout"><span>↪</span><b>Quitter</b></a>
          </div>
        )}
      </nav>
      <main className="portal-main">
        {children}
      </main>
      
      <style>{`
        .portal-shell { min-height: 100vh; background: #f6f8fc; font-family: Poppins, sans-serif; }
        .portal-nav { display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; background: rgba(255,255,255,.96); border-bottom: 1px solid #e5e7eb; position:sticky; top:0; z-index:50; backdrop-filter:blur(14px); }
        .portal-nav .brand { display: flex; align-items: center; gap: 12px; font-weight: 700; color: #111827; text-decoration: none; font-size: 1.1rem; }
        .portal-nav .brand img { width: 32px; height: 32px; border-radius: 6px; object-fit: cover; }
        .portal-nav-links { display: flex; gap: 16px; align-items: center; }
        .portal-nav-links a { color: #4b5563; text-decoration: none; font-weight: 600; font-size: 0.82rem; }
        .portal-nav-links a span { display:none; }
        .portal-nav-links a b { font-weight:inherit; }
        .portal-nav-links .portal-logout { color:#dc2626; }
        .portal-nav-links a:hover { color: #111827; }
        .portal-main { max-width: 1240px; margin: 0 auto; padding: 32px 22px 90px; }
        @media (max-width: 640px) {
          .portal-nav { padding:10px 16px; }
          .portal-nav .brand { font-size:.95rem; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
          .portal-nav-links { position:fixed; left:0; right:0; bottom:0; z-index:60; background:white; border-top:1px solid #e2e8f0; padding:7px 4px calc(7px + env(safe-area-inset-bottom)); display:grid; grid-template-columns:repeat(5,1fr); gap:0; box-shadow:0 -8px 25px rgba(15,23,42,.08); }
          .portal-nav-links a { min-width:0; display:flex; flex-direction:column; align-items:center; gap:3px; font-size:.62rem; padding:4px 2px; color:#64748b; }
          .portal-nav-links a span { display:block; font-size:1.15rem; color:#0b3a6e; }
          .portal-nav-links .portal-logout { display:none; }
          .portal-nav-links .portal-tontine-link { display:none; }
          .portal-main { padding:18px 12px 100px; }
        }
      `}</style>
    </div>
  );
}
