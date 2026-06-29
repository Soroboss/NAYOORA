import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient as createClient } from "@/lib/insforge/server";
import { ChatClient } from "./chat-client";

export default async function ChatPage() {
  const cookieStore = await cookies();
  const sessionString = cookieStore.get("portal_session")?.value;
  if (!sessionString) redirect("/portal/login");
  
  let session;
  try { session = JSON.parse(sessionString); } catch { redirect("/portal/login"); }

  const insforge = await createClient();

  const { data: member } = await insforge.from("member_profiles").select("organization_id").eq("id", session.memberId).single();
  if (!member) redirect("/portal/login");

  // Fetch all active members in the same organization
  const { data: contacts } = await insforge.from("member_profiles")
    .select("id, first_name, last_name, member_number")
    .eq("organization_id", member.organization_id)
    .neq("id", session.memberId)
    .eq("status", "active")
    .order("first_name", { ascending: true });

  return (
    <div>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px" }}>Messagerie</h1>
        <p style={{ color: "#6b7280" }}>Discutez avec les membres de votre organisation.</p>
      </header>

      <div className="panel" style={{ padding: "0", display: "flex", height: "60vh", minHeight: "400px", overflow: "hidden" }}>
        <ChatClient currentMemberId={session.memberId} contacts={contacts || []} />
      </div>
      
      <style>{`
        .chat-sidebar { width: 30%; border-right: 1px solid #e5e7eb; overflow-y: auto; background: #f9fafb; }
        .chat-main { width: 70%; display: flex; flex-direction: column; background: #fff; }
        .contact-item { padding: 16px; border-bottom: 1px solid #e5e7eb; cursor: pointer; transition: background 0.2s; }
        .contact-item:hover { background: #f3f4f6; }
        .contact-item.active { background: #eff6ff; border-left: 4px solid #2563eb; }
        .messages-area { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .message-bubble { max-width: 70%; padding: 10px 14px; border-radius: 12px; font-size: 0.95rem; line-height: 1.4; }
        .message-mine { align-self: flex-end; background: #2563eb; color: #fff; border-bottom-right-radius: 2px; }
        .message-theirs { align-self: flex-start; background: #f3f4f6; color: #111827; border-bottom-left-radius: 2px; }
        .message-input-area { padding: 16px; border-top: 1px solid #e5e7eb; display: flex; gap: 8px; background: #fff; }
        .chat-input { flex: 1; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; }
        .chat-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.2); }
        .send-btn { background: #111827; color: white; border: none; padding: 0 16px; border-radius: 8px; cursor: pointer; font-weight: 500; }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        @media (max-width: 640px) {
          .chat-sidebar { width: 40%; }
          .chat-main { width: 60%; }
        }
      `}</style>
    </div>
  );
}
