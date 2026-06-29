import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient as createClient } from "@/lib/insforge/server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const sessionString = cookieStore.get("portal_session")?.value;
  if (!sessionString) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  
  let session;
  try { session = JSON.parse(sessionString); } catch { return NextResponse.json({ error: "Invalide" }, { status: 401 }); }

  const url = new URL(request.url);
  const withMemberId = url.searchParams.get("with");
  if (!withMemberId) return NextResponse.json({ error: "Contact requis" }, { status: 400 });

  const insforge = await createClient();

  // Find or create conversation
  let { data: conv } = await insforge.from("chat_conversation_participants")
    .select("conversation_id")
    .eq("member_profile_id", session.memberId)
    .in("conversation_id", (
      await insforge.from("chat_conversation_participants").select("conversation_id").eq("member_profile_id", withMemberId)
    ).data?.map((c:any) => c.conversation_id) || [])
    .limit(1).maybeSingle();

  if (!conv) {
    // We create the conversation dynamically on the server
    // Since RLS is tricky from client, we use service_role or server client
    const { data: org } = await insforge.from("member_profiles").select("organization_id").eq("id", session.memberId).single();
    if (!org) return NextResponse.json({ error: "Org non trouvée" }, { status: 400 });

    const { data: newConv } = await insforge.from("chat_conversations").insert({ organization_id: org.organization_id }).select().single();
    if (newConv) {
      await insforge.from("chat_conversation_participants").insert([
        { conversation_id: newConv.id, organization_id: org.organization_id, member_profile_id: session.memberId },
        { conversation_id: newConv.id, organization_id: org.organization_id, member_profile_id: withMemberId }
      ]);
      conv = { conversation_id: newConv.id };
    } else {
      return NextResponse.json({ messages: [] });
    }
  }

  // Fetch messages
  const { data: messages } = await insforge.from("chat_messages")
    .select("*")
    .eq("conversation_id", conv.conversation_id)
    .order("created_at", { ascending: true })
    .limit(100);

  return NextResponse.json({ conversationId: conv.conversation_id, messages: messages || [] });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionString = cookieStore.get("portal_session")?.value;
  if (!sessionString) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  
  let session;
  try { session = JSON.parse(sessionString); } catch { return NextResponse.json({ error: "Invalide" }, { status: 401 }); }

  const body = await request.json();
  if (!body.conversationId || !body.content) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });

  const insforge = await createClient();
  
  // Verify org
  const { data: org } = await insforge.from("member_profiles").select("organization_id").eq("id", session.memberId).single();

  const { data, error } = await insforge.from("chat_messages").insert({
    conversation_id: body.conversationId,
    organization_id: org.organization_id,
    sender_id: session.memberId,
    content: body.content
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
