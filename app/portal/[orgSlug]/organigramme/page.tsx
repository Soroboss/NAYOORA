import { OrganigramChart } from "@/components/organigram-chart";
import { cookies } from "next/headers";
import { createAdminClient as createClient } from "@/lib/insforge/server";
import { redirect } from "next/navigation";

export default async function OrganigramPortalPage(props: { params: Promise<{ orgSlug: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies();
  const sessionString = cookieStore.get("portal_session")?.value;
  if (!sessionString) redirect("/member/login");
  let session;
  try { session = JSON.parse(sessionString); } catch { redirect("/member/login"); }

  const insforge = await createClient();

  const { data: member, error: memberError } = await insforge
    .from("member_profiles")
    .select("organization_id, organization:organizations!member_profiles_organization_id_fkey(name)")
    .eq("id", session.memberId)
    .single();

  if (memberError) {
    console.error("Organigramme page member query error:", memberError);
  }

  if (!member) redirect("/api/portal/auth/logout");

  const { data: members } = await insforge
    .from("member_profiles")
    .select("id,first_name,last_name,title,reports_to,photo_url,office_role")
    .eq("organization_id", member.organization_id)
    .is("deleted_at", null)
    .order("last_name");

  const team = members || [];
  const leaders = team.filter((item) => item.office_role || item.title).length;
  const photos = team.filter((item) => item.photo_url).length;

  return (
    <section className="portal-organigram-page">
      <header className="portal-organigram-hero">
        <div>
          <p className="eyebrow">{(member.organization as any)?.name} · Gouvernance</p>
          <h1>Le bureau et son organisation</h1>
          <p>Visualisez les responsables, leurs fonctions et les liens hiérarchiques de l’organisation.</p>
        </div>
        <div className="organigram-badge">◎ Organigramme officiel</div>
      </header>

      <div className="organigram-stats">
        <div><strong>{team.length}</strong><span>Membres affichés</span></div>
        <div><strong>{leaders}</strong><span>Fonctions renseignées</span></div>
        <div><strong>{photos}</strong><span>Profils avec photo</span></div>
      </div>

      <div className="organigram-intro">
        <div><span>1</span><p><strong>Présidence</strong><small>Direction de l’organisation</small></p></div>
        <div><span>2</span><p><strong>Bureau exécutif</strong><small>Secrétariat et trésorerie</small></p></div>
        <div><span>3</span><p><strong>Commissions</strong><small>Responsables et membres</small></p></div>
      </div>

      <OrganigramChart members={team} />

      <style>{`
        .portal-organigram-page { display: grid; gap: 20px; }
        .portal-organigram-hero { padding: 30px; border-radius: 24px; color: white; background: radial-gradient(circle at 90% 0%, rgba(14,159,110,.8), transparent 36%), linear-gradient(135deg,#061c43,#0b3a6e); display:flex; align-items:flex-end; justify-content:space-between; gap:24px; }
        .portal-organigram-hero h1 { margin:7px 0 8px; font-size:clamp(1.8rem,4vw,2.7rem); letter-spacing:-.04em; }
        .portal-organigram-hero p { margin:0; color:#dbeafe; max-width:650px; line-height:1.6; }
        .portal-organigram-hero .eyebrow { color:#6ee7b7; font-weight:800; text-transform:uppercase; letter-spacing:.1em; font-size:.72rem; }
        .organigram-badge { white-space:nowrap; padding:10px 14px; border:1px solid rgba(255,255,255,.22); border-radius:999px; background:rgba(255,255,255,.1); font-size:.82rem; font-weight:700; }
        .organigram-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
        .organigram-stats div { padding:18px; background:white; border:1px solid #e2e8f0; border-radius:16px; display:flex; flex-direction:column; gap:3px; }
        .organigram-stats strong { font-size:1.6rem; color:#0b3a6e; }
        .organigram-stats span { color:#64748b; font-size:.8rem; }
        .organigram-intro { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        .organigram-intro > div { display:flex; align-items:center; gap:10px; padding:12px 14px; background:#f8fafc; border-radius:14px; }
        .organigram-intro span { width:30px; height:30px; display:grid; place-items:center; border-radius:50%; background:#e0f2fe; color:#075985; font-weight:800; }
        .organigram-intro p { margin:0; display:flex; flex-direction:column; }
        .organigram-intro small { color:#64748b; margin-top:2px; }
        @media(max-width:700px){
          .portal-organigram-hero { padding:22px; align-items:flex-start; flex-direction:column; }
          .organigram-stats { grid-template-columns:repeat(3,minmax(0,1fr)); gap:7px; }
          .organigram-stats div { padding:12px 9px; }
          .organigram-stats strong { font-size:1.25rem; }
          .organigram-stats span { font-size:.68rem; }
          .organigram-intro { grid-template-columns:1fr; }
        }
      `}</style>
    </section>
  );
}
