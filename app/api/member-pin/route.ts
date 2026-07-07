import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/insforge/server";
import { memberContext } from "@/lib/member-portal";
import { createHash } from "crypto";

const hashPin = (pin: string) => createHash("sha256").update(pin).digest("hex");

export async function POST(request: Request) {
  try {
    const { currentPin, newPin } = await request.json();
    
    if (!newPin || newPin.length !== 4) {
      return NextResponse.json({ error: "Le nouveau code PIN doit contenir exactement 4 chiffres." }, { status: 400 });
    }

    const { profile } = await memberContext();
    if (!profile?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const adminS = await createAdminClient();
    const { data: member, error } = await adminS.from("member_profiles").select("pin_hash").eq("id", profile.id).single();
    
    if (error || !member) {
      return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
    }

    // Verify current PIN if it exists
    if (member.pin_hash) {
      if (!currentPin) {
        return NextResponse.json({ error: "Veuillez fournir votre code PIN actuel." }, { status: 400 });
      }
      
      const currentPinHash = hashPin(currentPin);
      if (member.pin_hash !== currentPinHash) {
        return NextResponse.json({ error: "Le code PIN actuel est incorrect." }, { status: 401 });
      }
    }

    // Update PIN
    const newPinHash = hashPin(newPin);
    const { error: updateError } = await adminS.from("member_profiles").update({ pin_hash: newPinHash }).eq("id", profile.id);

    if (updateError) {
      console.error("Erreur lors de la mise à jour du PIN:", updateError);
      return NextResponse.json({ error: "Une erreur est survenue lors du changement de code PIN." }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erreur dans member-pin API:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
