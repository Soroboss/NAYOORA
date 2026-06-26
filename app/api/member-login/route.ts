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
      const { data: member, error } = await s
        .from("member_profiles")
        .select("id, organization_id, status")
        .eq("id", memberId)
        .eq("phone", phone.trim())
        .is("deleted_at", null)
        .single();
        
      if (error || !member) return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
      if (member.status !== 'active') return NextResponse.json({ error: "Ce compte n'est pas actif." }, { status: 403 });
      
      const cookieStore = await cookies();
      cookieStore.set("member_session", JSON.stringify({ memberId: member.id, organizationId: member.organization_id }), {
        httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7
      });
      return NextResponse.json({ success: true, memberId: member.id });
    }

    // Step 1: Find all member profiles by phone
    const { data: members, error } = await s
      .from("member_profiles")
      .select(`id, organization_id, status, organizations(name, organization_type)`)
      .eq("phone", phone.trim())
      .is("deleted_at", null)
      .eq("status", "active");

    if (error || !members || members.length === 0) {
      return NextResponse.json({ error: "Aucun membre actif trouvé avec ce numéro." }, { status: 404 });
    }

    // If only one active profile, log them in directly
    if (members.length === 1) {
      const member = members[0];
      const cookieStore = await cookies();
      cookieStore.set("member_session", JSON.stringify({ memberId: member.id, organizationId: member.organization_id }), {
        httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7
      });
      return NextResponse.json({ success: true, memberId: member.id });
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
