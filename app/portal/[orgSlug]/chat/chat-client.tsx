"use client";

import { useState, useEffect, useRef } from "react";

export function ChatClient({ currentMemberId, contacts }: { currentMemberId: string, contacts: any[] }) {
  const [activeContact, setActiveContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
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
    
    // Simple polling
    const interval = setInterval(() => {
      fetchMessages(activeContact.id);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [activeContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !conversationId) return;
    setSending(true);
    
    // Optimistic UI update
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
      // Background refresh happens automatically via polling
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="chat-sidebar">
        {contacts.length === 0 ? (
          <div style={{ padding: "16px", color: "#6b7280", fontSize: "0.9rem" }}>Aucun autre membre trouvé.</div>
        ) : (
          contacts.map(c => (
            <div 
              key={c.id} 
              className={`contact-item ${activeContact?.id === c.id ? "active" : ""}`}
              onClick={() => setActiveContact(c)}
            >
              <div style={{ fontWeight: 600, color: "#111827" }}>{c.first_name} {c.last_name}</div>
              {c.member_number && <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{c.member_number}</div>}
            </div>
          ))
        )}
      </div>
      
      <div className="chat-main">
        {!activeContact ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
            Sélectionnez un contact pour démarrer
          </div>
        ) : (
          <>
            <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>
              {activeContact.first_name} {activeContact.last_name}
            </div>
            
            <div className="messages-area">
              {messages.length === 0 ? (
                <div style={{ textAlign: "center", color: "#9ca3af", marginTop: "auto", marginBottom: "auto" }}>
                  Aucun message. Envoyez "Bonjour" !
                </div>
              ) : (
                messages.map(m => {
                  const isMine = m.sender_id === currentMemberId;
                  return (
                    <div key={m.id} className={`message-bubble ${isMine ? "message-mine" : "message-theirs"}`}>
                      {m.content}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form className="message-input-area" onSubmit={sendMessage}>
              <input 
                type="text" 
                className="chat-input" 
                placeholder="Votre message..." 
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <button type="submit" className="send-btn" disabled={!text.trim() || sending}>
                Envoyer
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
