import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient as createClient } from "@/lib/insforge/server";
import { PortalVoting } from "@/components/portal-voting";

export default async function PortalGovernancePage() {
  const cookieStore = await cookies();
  const sessionString = cookieStore.get("portal_session")?.value;
  if (!sessionString) redirect("/portal/login");

  let session;
  try {
    session = JSON.parse(sessionString);
  } catch {
    redirect("/portal/login");
  }

  const insforge = await createClient();

  // Fetch active elections for this organization
  const { data: elections } = await insforge
    .from("elections")
    .select("*, candidates:election_candidates(*, member:member_profiles(first_name, last_name)), votes:election_votes(id, member_profile_id)")
    .eq("organization_id", session.organizationId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <div>
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px" }}>Vote Électronique</h1>
        <p style={{ color: "#6b7280" }}>Participez aux décisions de votre organisation.</p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {elections?.length === 0 ? (
          <div className="panel" style={{ textAlign: "center", padding: "32px" }}>
            <p style={{ color: "#6b7280" }}>Aucune élection active en ce moment.</p>
          </div>
        ) : (
          elections?.map((e) => {
            // Check if member already voted
            const hasVoted = e.votes.some((v: any) => v.member_profile_id === session.memberId);

            return (
              <div key={e.id} className="panel">
                <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>{e.title}</h2>
                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>{e.description}</p>
                
                {hasVoted ? (
                  <div style={{ background: "#dcfce7", color: "#166534", padding: "16px", borderRadius: "8px", textAlign: "center", fontWeight: "600" }}>
                    ✓ Vous avez déjà voté pour cette élection.
                  </div>
                ) : (
                  <PortalVoting electionId={e.id} candidates={e.candidates} memberId={session.memberId} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
