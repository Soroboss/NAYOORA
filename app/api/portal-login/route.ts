import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/insforge/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";

const hashPin = (pin: string) => createHash("sha256").update(pin).digest("hex");

export async function POST(request: Request) {
  try {
    const { identifier, pin, orgSlug } = await request.json();
    if (!identifier || !orgSlug) return NextResponse.json({ error: "Identifiant et organisation requis." }, { status: 400 });

    const s = await createClient();
    const adminS = await createAdminClient();
    
    // 1. Fetch the organization by slug
    const { data: org, error: orgError } = await s.from("organizations").select("id, name").eq("slug", orgSlug).single();
    if (orgError || !org) {
      return NextResponse.json({ error: "Organisation introuvable." }, { status: 404 });
    }

    // 2. Determine if identifier is email or phone
    const isEmail = identifier.includes('@');
    const normalizedIdentifier = isEmail ? identifier.trim().toLowerCase() : identifier.replace(/\D/g, '');

    // 3. Find the member profile
    let query = adminS.from("member_profiles").select("id, pin_hash, status").eq("organization_id", org.id).is("deleted_at", null);
    
    if (isEmail) {
      query = query.eq("email", normalizedIdentifier);
    } else {
      // Need to find by phone (either exact match or suffix)
      // Since it's server-side, we can fetch all with phone and filter, or use an RPC if available.
      // But we have the RPC `find_member_profiles_by_phone` which checks the phone. Let's use it and filter by org.id
      const { data: membersByPhone } = await s.rpc("find_member_profiles_by_phone", { phone_number: identifier });
      const found = membersByPhone?.find((m: any) => m.organization_id === org.id);
      if (found) {
        query = query.eq("id", found.id);
      } else {
        return NextResponse.json({ error: "Aucun membre actif trouvé avec cet identifiant." }, { status: 404 });
      }
    }

    const { data: profile, error: profError } = await query.single();
    
    if (profError || !profile) {
      return NextResponse.json({ error: "Aucun membre actif trouvé avec cet identifiant." }, { status: 404 });
    }

    if (profile.status !== 'active') {
      return NextResponse.json({ error: "Votre compte membre n'est pas actif." }, { status: 403 });
    }

    // 4. Verify PIN
    const providedPin = pin || "0000"; // Default to 0000 if not provided
    const providedPinHash = hashPin(providedPin);

    if (!profile.pin_hash) {
      // First time setup: assign the provided PIN or 0000
      await adminS.from("member_profiles").update({ pin_hash: providedPinHash }).eq("id", profile.id);
    } else {
      if (profile.pin_hash !== providedPinHash) {
        return NextResponse.json({ error: "Code PIN incorrect." }, { status: 401 });
      }
    }

    // 5. Set session
    const sessionData = JSON.stringify({ memberId: profile.id, organizationId: org.id });
    const cookieStore = await cookies();
    cookieStore.set("member_session", sessionData, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7
    });

    return NextResponse.json({ success: true, memberId: profile.id, orgSlug });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur de connexion." }, { status: 500 });
  }
}
