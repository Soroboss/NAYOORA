import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/insforge/server";

async function getSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("member_session")?.value || cookieStore.get("portal_session")?.value;
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    return session.memberId && session.organizationId ? session : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const withMemberId = new URL(request.url).searchParams.get("with");
  if (!withMemberId || withMemberId === session.memberId) return NextResponse.json({ error: "Contact invalide." }, { status: 400 });
  const database = await createAdminClient();

  const [{ data: currentMember }, { data: contact }] = await Promise.all([
    database.from("member_profiles").select("id,organization_id").eq("id", session.memberId).eq("organization_id", session.organizationId).is("deleted_at", null).maybeSingle(),
    database.from("member_profiles").select("id,organization_id").eq("id", withMemberId).eq("organization_id", session.organizationId).eq("status", "active").is("deleted_at", null).maybeSingle(),
  ]);
  if (!currentMember || !contact) return NextResponse.json({ error: "Ce contact n’appartient pas à votre organisation." }, { status: 403 });

  const { data: contactConversations } = await database.from("chat_conversation_participants").select("conversation_id").eq("organization_id", session.organizationId).eq("member_profile_id", contact.id);
  const conversationIds = (contactConversations || []).map((item: any) => item.conversation_id);
  let conversationId: string | null = null;
  if (conversationIds.length) {
    const { data: participant } = await database.from("chat_conversation_participants").select("conversation_id").eq("organization_id", session.organizationId).eq("member_profile_id", currentMember.id).in("conversation_id", conversationIds).limit(1).maybeSingle();
    if (participant) {
      const { data: conversation } = await database.from("chat_conversations").select("id").eq("id", participant.conversation_id).eq("organization_id", session.organizationId).maybeSingle();
      conversationId = conversation?.id || null;
    }
  }

  if (!conversationId) {
    const { data: conversation, error } = await database.from("chat_conversations").insert({ organization_id: session.organizationId }).select("id").single();
    if (error || !conversation) return NextResponse.json({ error: error?.message || "Conversation impossible." }, { status: 400 });
    const { error: participantError } = await database.from("chat_conversation_participants").insert([
      { conversation_id: conversation.id, organization_id: session.organizationId, member_profile_id: currentMember.id },
      { conversation_id: conversation.id, organization_id: session.organizationId, member_profile_id: contact.id },
    ]);
    if (participantError) return NextResponse.json({ error: participantError.message }, { status: 400 });
    conversationId = conversation.id;
  }

  const { data: messages, error } = await database.from("chat_messages").select("id,conversation_id,sender_id,content,created_at").eq("conversation_id", conversationId).eq("organization_id", session.organizationId).order("created_at", { ascending: true }).limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ conversationId, messages: messages || [] });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const body = await request.json();
  const content = String(body.content || "").trim().slice(0, 4000);
  if (!body.conversationId || !content) return NextResponse.json({ error: "Message requis." }, { status: 400 });
  const database = await createAdminClient();
  const [{ data: member }, { data: conversation }, { data: participant }] = await Promise.all([
    database.from("member_profiles").select("id").eq("id", session.memberId).eq("organization_id", session.organizationId).eq("status", "active").is("deleted_at", null).maybeSingle(),
    database.from("chat_conversations").select("id").eq("id", body.conversationId).eq("organization_id", session.organizationId).maybeSingle(),
    database.from("chat_conversation_participants").select("conversation_id").eq("conversation_id", body.conversationId).eq("organization_id", session.organizationId).eq("member_profile_id", session.memberId).maybeSingle(),
  ]);
  if (!member || !conversation || !participant) return NextResponse.json({ error: "Accès à cette conversation refusé." }, { status: 403 });
  const { data, error } = await database.from("chat_messages").insert({ conversation_id: conversation.id, organization_id: session.organizationId, sender_id: member.id, content }).select("id,conversation_id,sender_id,content,created_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: data }, { status: 201 });
}
