import { redirect } from "next/navigation";
import { memberContext } from "@/lib/member-portal";
import { ChatClient } from "@/app/portal/[orgSlug]/chat/chat-client";
import { PinModifierModal } from "./PinModifierModal";

export default async function MemberChatPage() {
  const { s, m, profile } = await memberContext();
  if (!profile?.id) redirect("/member");
  const { data: contacts } = await s.from("member_profiles")
    .select("id,first_name,last_name,member_number,photo_url")
    .eq("organization_id", m.organization_id)
    .neq("id", profile.id)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("first_name", { ascending: true });

  return (
    <div className="member-chat-page">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p className="eyebrow">Votre organisation</p>
          <h1>Chat interne</h1>
          <p>Échangez directement et en toute confidentialité avec les autres membres.</p>
        </div>
        <div>
          <PinModifierModal />
        </div>
      </header>
      <div className="chat-container"><ChatClient currentMemberId={profile.id} contacts={contacts || []} /></div>
      <style>{`
        .member-chat-page{height:100%;display:flex;flex-direction:column}.member-chat-page>header{margin-bottom:18px}.member-chat-page h1{margin:3px 0 5px;color:#0b2447}.member-chat-page header p:last-child{color:#66758a;margin:0}.chat-container{flex:1;display:flex;min-height:64vh;height:calc(100vh - 190px);max-height:820px;border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 12px 34px rgba(11,58,110,.09);border:1px solid #e2e8f0;position:relative}.chat-sidebar{width:330px;border-right:1px solid #e5e7eb;background:#f8fafc;display:flex;flex-direction:column;z-index:10}.chat-sidebar-header{padding:16px;background:#f1f5f9;border-bottom:1px solid #e5e7eb;font-weight:700;color:#0b3a6e}.chat-sidebar-list{flex:1;overflow-y:auto}.chat-main{flex:1;display:flex;flex-direction:column;background:#efeae2;position:relative}.chat-main:before{content:"";position:absolute;inset:0;background-image:url('data:image/svg+xml;utf8,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><g fill="%23000000" fill-opacity="0.03"><path d="M10 10h10v10H10zM30 30h10v10H30zM50 50h10v10H50zM70 70h10v10H70z"/></g></svg>');z-index:0;opacity:.5}@media(max-width:768px){.member-content-area{padding-left:0!important;padding-right:0!important}.member-chat-page>header{padding:0 16px}.chat-container{height:calc(100dvh - 225px);min-height:560px;border-radius:0;border-left:0;border-right:0}.chat-sidebar{width:100%;position:absolute;inset:0;transition:transform .25s ease}.chat-sidebar.hidden{transform:translateX(-100%)}.chat-main{position:absolute;inset:0}}.chat-sidebar-list::-webkit-scrollbar,.messages-area::-webkit-scrollbar{width:6px}.chat-sidebar-list::-webkit-scrollbar-thumb,.messages-area::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:10px}
      `}</style>
    </div>
  );
}
