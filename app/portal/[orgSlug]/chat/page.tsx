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
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <header style={{ marginBottom: "16px", padding: "0 16px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700" }}>Messagerie</h1>
        <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>Discutez avec les membres de votre organisation de manière sécurisée.</p>
      </header>

      <div className="chat-container">
        <ChatClient currentMemberId={session.memberId} contacts={contacts || []} />
      </div>

      <style>{`
        /* Global Chat Styles */
        .chat-container {
          flex: 1;
          display: flex;
          min-height: 60vh;
          height: calc(100vh - 200px);
          max-height: 800px;
          border-radius: 16px;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
          border: 1px solid #e5e7eb;
          position: relative;
        }

        .chat-sidebar {
          width: 350px;
          border-right: 1px solid #e5e7eb;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          z-index: 10;
        }

        .chat-sidebar-header {
          padding: 16px;
          background: #f1f5f9;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 600;
          color: #334155;
          display: flex;
          align-items: center;
        }

        .chat-sidebar-list {
          flex: 1;
          overflow-y: auto;
        }

        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #efeae2; /* WhatsApp-like background */
          position: relative;
        }

        .chat-main::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: url('data:image/svg+xml;utf8,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><g fill="%23000000" fill-opacity="0.03"><path d="M10 10h10v10H10zM30 30h10v10H30zM50 50h10v10H50zM70 70h10v10H70z"/></g></svg>');
          z-index: 0;
          opacity: 0.5;
        }

        /* Responsive behavior */
        @media (max-width: 768px) {
          .chat-sidebar {
            width: 100%;
            position: absolute;
            top: 0; bottom: 0; left: 0; right: 0;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .chat-sidebar.hidden {
            transform: translateX(-100%);
          }
          .chat-main {
            position: absolute;
            top: 0; bottom: 0; left: 0; right: 0;
          }
        }

        /* Scrollbars */
        .chat-sidebar-list::-webkit-scrollbar, .messages-area::-webkit-scrollbar {
          width: 6px;
        }
        .chat-sidebar-list::-webkit-scrollbar-thumb, .messages-area::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
