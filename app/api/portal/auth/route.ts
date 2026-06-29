import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/insforge/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { phone, pin } = await request.json();
    if (!phone || !pin) return NextResponse.json({ error: "Numéro et PIN requis." }, { status: 400 });

    const insforge = await createAdminClient();
    
    // Find the member by phone (handle various formats like +225, spaces, etc.)
    const cleanPhone = phone.replace(/\s/g, "");
    
    // Remove +225 if it exists to get the local 10-digit format
    let localPhone = cleanPhone;
    if (localPhone.startsWith("+225")) localPhone = localPhone.substring(4);
    if (localPhone.startsWith("225") && localPhone.length === 13) localPhone = localPhone.substring(3); // handles 22507...
    
    const withPrefix = `+225${localPhone}`;
    // Common space format: 07 57 22 87 31
    const spacedLocal = localPhone.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
    const spacedPrefix = `+225 ${spacedLocal}`;

    const { data: member, error } = await insforge
      .from("member_profiles")
      .select("id, organization_id")
      .or(`phone.eq.${cleanPhone},phone.eq.${localPhone},phone.eq.${withPrefix},phone.eq.${spacedLocal},phone.eq.${spacedPrefix}`)
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    const hasServiceKey = !!process.env.INSFORGE_SERVICE_KEY;

    if (error || !member) {
      const debugInfo = JSON.stringify({ hasServiceKey, databaseError: error?.message, memberFound: !!member });
      return NextResponse.json({ 
        error: `Numéro de téléphone introuvable ou compte inactif. [Debug: ${debugInfo}]`
      }, { status: 404 });
    }

    // Very simple PIN verification for the prototype.
    // In production, we'd compare the hashed PIN using bcrypt.
    // We accept "0000" as the default PIN since pin_hash column doesn't exist yet.
    const isPinValid = pin === "0000";

    if (!isPinValid) {
      return NextResponse.json({ error: "Code PIN incorrect." }, { status: 401 });
    }

    // Create session cookie
    const sessionData = {
      memberId: member.id,
      organizationId: member.organization_id
    };

    const cookieStore = await cookies();
    cookieStore.set("portal_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/"
    });

    const headers = new Headers();
    headers.append("Set-Cookie", cookieStore.toString());

    // Fetch the organization slug
    const { data: org } = await insforge
      .from("organizations")
      .select("slug")
      .eq("id", member.organization_id)
      .single();

    const orgSlug = org?.slug || "login";

    return NextResponse.json({ success: true, orgSlug }, { status: 200, headers });
  } catch (error: any) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
