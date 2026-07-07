import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/insforge/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";

const hashPin = (pin: string) => createHash("sha256").update(pin).digest("hex");

export async function POST(request: Request) {
  try {
    const { phone, memberId, pin } = await request.json();
    if (!phone) return NextResponse.json({ error: "Numéro de téléphone requis." }, { status: 400 });

    const s = await createClient();
    const adminS = await createAdminClient();
    
    // Step 1: Find all member profiles by phone
    const { data: members, error } = await s.rpc("find_member_profiles_by_phone", { phone_number: phone.trim() });

    if (error || !members || members.length === 0) {
      console.error("Member login error:", error, "Phone:", phone);
      return NextResponse.json({ error: "Aucun membre actif trouvé avec ce numéro." }, { status: 404 });
    }

    let targetMemberId = memberId;

    if (!targetMemberId) {
      // If only one active profile, select it
      if (members.length === 1) {
        targetMemberId = members[0].id;
      } else {
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
      }
    } else {
      // Ensure the selected memberId belongs to the phone number
      const isValidMember = members.some((m: any) => m.id === targetMemberId);
      if (!isValidMember) return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
    }

    // Now process the PIN code for the targetMemberId
    const { data: profile, error: profError } = await adminS.from("member_profiles").select("id, organization_id, pin_hash").eq("id", targetMemberId).single();
    if (profError || !profile) return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });

    const providedPin = pin || "0000"; // Default to 0000 if not provided
    const providedPinHash = hashPin(providedPin);

    if (!profile.pin_hash) {
      // First time setup: assign the provided PIN or 0000
      await adminS.from("member_profiles").update({ pin_hash: providedPinHash }).eq("id", targetMemberId);
    } else {
      // Verify PIN
      if (profile.pin_hash !== providedPinHash) {
        return NextResponse.json({ error: "Code PIN incorrect." }, { status: 401 });
      }
    }

    // Fetch organization slug for redirect
    const { data: org } = await s.from("organizations").select("slug").eq("id", profile.organization_id).single();
    const orgSlug = org?.slug || "unknown";

    const sessionData = JSON.stringify({ memberId: profile.id, organizationId: profile.organization_id });

    const cookieStore = await cookies();
    // Set both sessions
    cookieStore.set("member_session", sessionData, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7
    });
    cookieStore.set("portal_session", sessionData, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7
    });

    return NextResponse.json({ success: true, memberId: profile.id, orgSlug });

  } catch (error) {
    return NextResponse.json({ error: "Erreur de connexion." }, { status: 500 });
  }
}
