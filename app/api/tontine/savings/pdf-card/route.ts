import { NextResponse } from "next/server";
import { createClient } from "@/lib/insforge/server";
import { generateSavingsCardPDF } from "@/lib/services/card/savingsPdfGenerator";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get("cardId");

  if (!cardId) {
    return NextResponse.json({ error: "cardId manquant" }, { status: 400 });
  }

  const insforge = await createClient();
  
  // Verify auth
  const { data: { user } } = await insforge.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Fetch card data with relations
  const { data: card, error } = await insforge
    .from("tontine_savings_cards")
    .select(`
      id,
      expected_amount,
      organization_id,
      member:member_profiles(first_name, last_name),
      product:tontine_savings_products(name, contribution_amount, duration_days),
      organization:organizations(name)
    `)
    .eq("id", cardId)
    .single();

  if (error || !card) {
    return NextResponse.json({ error: "Carte introuvable" }, { status: 404 });
  }

  // Check organization access
  const { data: membership } = await insforge
    .from("organization_members")
    .select("role")
    .eq("organization_id", card.organization_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const pdfBytes = await generateSavingsCardPDF({
      orgName: (card.organization as any)?.name || "Organisation",
      memberName: `${(card.member as any)?.first_name} ${(card.member as any)?.last_name}`,
      productName: (card.product as any)?.name || "Produit",
      contributionAmount: Number((card.product as any)?.contribution_amount),
      durationDays: Number((card.product as any)?.duration_days),
      expectedAmount: Number(card.expected_amount),
      cardId: card.id,
    });

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="carte-epargne-${card.id}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "Erreur lors de la génération du PDF" }, { status: 500 });
  }
}
