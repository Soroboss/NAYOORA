import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/insforge/server";
import { cookies } from "next/headers";

export async function memberContext() {
  const s = await createAdminClient();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("member_session");
  
  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie.value);
      if (session.memberId && session.organizationId) {
        // Fetch organization details manually since we don't have organization_members record here
        const { data: org } = await s.from("organizations").select("name").eq("id", session.organizationId).maybeSingle();
        const m = { id: session.memberId, organization_id: session.organizationId, organization: org };
        const { data: profile } = await s.from("member_profiles").select("id, first_name, last_name, photo_url").eq("id", session.memberId).eq("organization_id", session.organizationId).is("deleted_at", null).maybeSingle();
        if (profile) return { s, m, profile };
      }
    } catch (e) {
      // JSON parse error or fetch error, fallback to normal auth
    }
  }

  // Fallback for admins/users checking out the member portal
  const regularClient = await createClient();
  const { data: { user } } = await regularClient.auth.getUser();
  if (!user) redirect('/member/login');
  
  const { data: m } = await s.from('organization_members').select('id,organization_id,organization:organizations(name)').eq('user_id', user.id).eq('status', 'active').limit(1).maybeSingle();
  if (!m) redirect('/onboarding');
  
  const { data: profile } = await s.from('member_profiles').select('id,first_name,last_name,photo_url').eq('organization_member_id', m.id).eq('organization_id', m.organization_id).is('deleted_at', null).maybeSingle();
  return { s, m, profile };
}
