import { NextResponse } from "next/server";
import { createClient } from "@/lib/insforge/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { phone, memberId } = await request.json();
    if (!phone) return NextResponse.json({ error: "Numéro de téléphone requis." }, { status: 400 });

    const s = await createClient();
    
    // If a specific memberId is provided (Step 2 of Smart Login)
    if (memberId) {
      const { data, error } = await s.rpc("find_member_profiles_by_phone", { phone_number: phone.trim() });
      if (error || !data || data.length === 0) return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });

      const member = data.find((m: any) => m.id === memberId);
      if (!member) return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });

      // Fetch organization slug for redirect
      const { data: org } = await s.from("organizations").select("slug").eq("id", member.organization_id).single();
      const orgSlug = org?.slug || "unknown";

      const sessionData = JSON.stringify({ memberId: member.id, organizationId: member.organization_id });

      const cookieStore = await cookies();
      // Set both sessions
      cookieStore.set("member_session", sessionData, {
        httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7
      });
      cookieStore.set("portal_session", sessionData, {
        httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7
      });

      return NextResponse.json({ success: true, memberId: member.id, orgSlug });
    }

    // Step 1: Find all member profiles by phone
    const { data: members, error } = await s.rpc("find_member_profiles_by_phone", { phone_number: phone.trim() });

    if (error || !members || members.length === 0) {
      console.error("Member login error:", error, "Phone:", phone);
      return NextResponse.json({ error: "Aucun membre actif trouvé avec ce numéro." }, { status: 404 });
    }

    // If only one active profile, log them in directly
    if (members.length === 1) {
      const member = members[0];

      // Fetch organization slug for redirect
      const { data: org } = await s.from("organizations").select("slug").eq("id", member.organization_id).single();
      const orgSlug = org?.slug || "unknown";

      const sessionData = JSON.stringify({ memberId: member.id, organizationId: member.organization_id });

      const cookieStore = await cookies();
      cookieStore.set("member_session", sessionData, {
        httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7
      });
      cookieStore.set("portal_session", sessionData, {
        httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7
      });

      return NextResponse.json({ success: true, memberId: member.id, orgSlug });
    }

    // If multiple active profiles, return them for selection
    return NextResponse.json({ 
      multiple: true, 
      profiles: members.map((m: any) => ({
        memberId: m.id,
        organizationId: m.organization_id,
        organizationName: m.organizations?.name || "Organisation",
        organizationType: m.organizations?.organization_type || ""
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur de connexion." }, { status: 500 });
  }
}
