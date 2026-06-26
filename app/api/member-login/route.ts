import { NextResponse } from "next/server";
import { createClient } from "@/lib/insforge/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    if (!phone) return NextResponse.json({ error: "Numéro de téléphone requis." }, { status: 400 });

    const s = await createClient();
    
    // Find the member profile by phone
    const { data: member, error } = await s
      .from("member_profiles")
      .select("id, organization_id, status")
      .eq("phone", phone.trim())
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    if (error || !member) {
      return NextResponse.json({ error: "Aucun membre actif trouvé avec ce numéro." }, { status: 404 });
    }

    if (member.status !== 'active') {
      return NextResponse.json({ error: "Ce compte membre n'est pas actif." }, { status: 403 });
    }

    // Set a simple cookie to simulate member login session
    const cookieStore = await cookies();
    cookieStore.set("member_session", JSON.stringify({ 
      memberId: member.id, 
      organizationId: member.organization_id 
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return NextResponse.json({ success: true, memberId: member.id });
  } catch (error) {
    return NextResponse.json({ error: "Erreur de connexion." }, { status: 500 });
  }
}
