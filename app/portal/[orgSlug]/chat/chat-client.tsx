"use client";

import { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, Search, User } from "lucide-react";

export function ChatClient({ currentMemberId, contacts }: { currentMemberId: string, contacts: any[] }) {
  const [activeContact, setActiveContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (contactId: string) => {
    try {
      const res = await fetch(`/api/portal/chat?with=${contactId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setConversationId(data.conversationId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!activeContact) return;
    fetchMessages(activeContact.id);
    const interval = setInterval(() => {
      fetchMessages(activeContact.id);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeContact]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !conversationId) return;
    setSending(true);
    
    const newMsg = {
      id: Date.now().toString(),
      sender_id: currentMemberId,
      content: text,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMsg]);
    setText("");

    try {
      await fetch(`/api/portal/chat`, {
        method: "POST",
        body: JSON.stringify({ conversationId, content: newMsg.content })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <div className={`chat-sidebar ${activeContact ? "hidden" : ""}`}>
        <div className="chat-sidebar-header">
          Discussions
        </div>
        <div style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "10px", color: "#9ca3af" }} />
            <input 
              type="text" 
              placeholder="Rechercher un membre..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "8px 12px 8px 36px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem", outline: "none" }}
            />
          </div>
        </div>
        <div className="chat-sidebar-list">
          {filteredContacts.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "#9ca3af", fontSize: "0.9rem" }}>Aucun membre trouvé.</div>
          ) : (
            filteredContacts.map(c => {
              const isActive = activeContact?.id === c.id;
              return (
                <div 
                  key={c.id} 
                  onClick={() => setActiveContact(c)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 16px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f1f5f9",
                    background: isActive ? "#f1f5f9" : "transparent",
                    transition: "background 0.2s"
                  }}
                  onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = "#f8fafc"; }}
                  onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ width: "48px", height: "48px", borderRadius: "24px", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "16px", flexShrink: 0, color: "#64748b" }}>
                    <User size={24} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.first_name} {c.last_name}
                    </div>
                    {c.member_number && <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{c.member_number}</div>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <div className="chat-main" style={{ display: activeContact ? "flex" : "none" }}>
        {!activeContact ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", zIndex: 1, background: "#f8fafc" }}>
            <div style={{ textAlign: "center", background: "white", padding: "32px", borderRadius: "16px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ background: "#e0e7ff", width: "64px", height: "64px", borderRadius: "32px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#4f46e5" }}>
                <Send size={32} />
              </div>
              <h3 style={{ margin: "0 0 8px 0", color: "#1f2937" }}>Messagerie Interne</h3>
              <p style={{ margin: 0, fontSize: "0.95rem" }}>Sélectionnez un contact dans la liste pour démarrer une discussion sécurisée.</p>
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: "12px 16px", background: "white", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", zIndex: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <button 
                onClick={() => setActiveContact(null)}
                style={{ background: "none", border: "none", cursor: "pointer", marginRight: "16px", display: "flex", alignItems: "center", color: "#4f46e5", padding: "8px", borderRadius: "8px" }}
                className="mobile-back-btn"
              >
                <ArrowLeft size={20} />
              </button>
              <div style={{ width: "40px", height: "40px", borderRadius: "20px", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "12px", color: "#64748b" }}>
                <User size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "#111827" }}>{activeContact.first_name} {activeContact.last_name}</div>
                <div style={{ fontSize: "0.8rem", color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "3px", background: "#10b981", display: "inline-block" }}></span>
                  En ligne
                </div>
              </div>
            </div>
            
            <div className="messages-area" style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "8px", zIndex: 1 }}>
              {messages.length === 0 ? (
                <div style={{ alignSelf: "center", background: "#fff", padding: "8px 16px", borderRadius: "16px", fontSize: "0.85rem", color: "#6b7280", marginTop: "auto", marginBottom: "auto", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  Vos messages avec {activeContact.first_name} sont chiffrés.
                </div>
              ) : (
                messages.map((m, index) => {
                  const isMine = m.sender_id === currentMemberId;
                  const showTail = index === messages.length - 1 || messages[index + 1]?.sender_id !== m.sender_id;
                  
                  return (
                    <div 
                      key={m.id} 
                      style={{ 
                        alignSelf: isMine ? "flex-end" : "flex-start",
                        maxWidth: "75%",
                        background: isMine ? "#dcf8c6" : "#ffffff", /* WhatsApp classic colors */
                        color: "#111827",
                        padding: "8px 12px 6px 12px",
                        borderRadius: "8px",
                        borderBottomRightRadius: isMine && showTail ? "0px" : "8px",
                        borderBottomLeftRadius: !isMine && showTail ? "0px" : "8px",
                        boxShadow: "0 1px 1px rgba(0,0,0,0.1)",
                        marginBottom: showTail ? "8px" : "2px",
                        position: "relative",
                        fontSize: "0.95rem",
                        lineHeight: "1.4"
                      }}
                    >
                      <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.content}</div>
                      <div style={{ fontSize: "0.65rem", color: "#6b7280", textAlign: "right", marginTop: "4px", float: "right", marginLeft: "12px" }}>
                        {formatTime(m.created_at)}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div style={{ padding: "12px 16px", background: "#f0f2f5", zIndex: 10 }}>
              <form onSubmit={sendMessage} style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                <div style={{ flex: 1, background: "white", borderRadius: "24px", padding: "10px 16px", display: "flex", alignItems: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  <input 
                    type="text" 
                    placeholder="Écrivez un message..." 
                    value={text}
                    onChange={e => setText(e.target.value)}
                    style={{ width: "100%", border: "none", outline: "none", fontSize: "0.95rem", background: "transparent" }}
                    autoComplete="off"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={!text.trim() || sending}
                  style={{ 
                    width: "44px", height: "44px", borderRadius: "22px", 
                    background: text.trim() ? "#00a884" : "#9ca3af", 
                    color: "white", border: "none", 
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: text.trim() ? "pointer" : "default",
                    transition: "background 0.2s",
                    flexShrink: 0
                  }}
                >
                  <Send size={20} style={{ marginLeft: "4px" }} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      <style>{`
        @media (min-width: 769px) {
          .chat-main { display: flex !important; }
          .mobile-back-btn { display: none !important; }
        }
      `}</style>
    </>
  );
}
