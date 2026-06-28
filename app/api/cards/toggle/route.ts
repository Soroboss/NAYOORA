import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/insforge/server';

export async function POST(request: Request) {
  try {
    const { cardId, status } = await request.json();
    
    if (!cardId || !status) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    if (!['active', 'blocked'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const insforge = await createAdminClient();

    const { data: updatedCard, error } = await insforge
      .from('member_cards')
      .update({ status })
      .eq('id', cardId)
      .select()
      .single();

    if (error) throw new Error("Failed to update card status: " + error.message);
    
    return NextResponse.json({ success: true, card: updatedCard });
  } catch (error: any) {
    console.error("Card status toggle error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
