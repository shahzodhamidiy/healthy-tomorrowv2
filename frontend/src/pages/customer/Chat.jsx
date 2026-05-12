import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getSocket } from "@/lib/socket";
import { Send } from "lucide-react";

export default function Chat() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  // Load existing rooms; auto-open a default one for customers
  useEffect(() => {
    const load = async () => {
      const r = await api.get("/chat/rooms");
      let list = Array.isArray(r.data) ? r.data : [];
      if (list.length === 0 && user?.role === "customer") {
        const { data } = await api.post("/chat/rooms", {});
        list = [{ ...data, peers: [] }];
      }
      setRooms(list);
      if (list[0]) setActiveRoom(list[0]);
    };
    load();
  }, [user]);

  // Load messages and join room when activeRoom changes
  useEffect(() => {
    if (!activeRoom) return;
    api.get(`/chat/rooms/${activeRoom.id}/messages`).then((r) => {
      setMessages(Array.isArray(r.data) ? r.data : []);
    });
    const sock = getSocket();
    sock.emit("chat:join", { room_id: activeRoom.id });

    const onMsg = (msg) => {
      if (msg.room_id === activeRoom.id) {
        setMessages((m) => [...m, msg]);
      }
    };
    const onTyping = () => {
      setTyping(true);
      setTimeout(() => setTyping(false), 2000);
    };
    sock.on("chat:message", onMsg);
    sock.on("chat:typing", onTyping);
    return () => {
      sock.emit("chat:leave", { room_id: activeRoom.id });
      sock.off("chat:message", onMsg);
      sock.off("chat:typing", onTyping);
    };
  }, [activeRoom?.id]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e?.preventDefault?.();
    if (!text.trim() || !activeRoom) return;
    const t = text.trim();
    setText("");
    await api.post(`/chat/rooms/${activeRoom.id}/messages`, { text: t });
  };

  const onType = (e) => {
    setText(e.target.value);
    if (activeRoom) {
      getSocket().emit("chat:typing", { room_id: activeRoom.id, user_id: user?.id });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-8 h-[calc(100vh-180px)] flex gap-6">
      {/* Rooms list */}
      <aside className="w-72 card p-4 overflow-y-auto no-scrollbar hidden md:block">
        <div className="label-eyebrow px-2 mb-3">Conversations</div>
        {rooms.length === 0 ? (
          <div className="text-ink-3 text-sm p-2">No conversations yet</div>
        ) : (
          rooms.map((r) => {
            const peer = r.peers?.[0];
            return (
              <button
                key={r.id}
                onClick={() => setActiveRoom(r)}
                className={`w-full text-left p-3 rounded-xl mb-1 transition ${activeRoom?.id === r.id ? "bg-sage-light" : "hover:bg-cream"}`}
              >
                <div className="font-medium text-sm">{peer?.name || "Support"}</div>
                <div className="text-xs text-ink-3 truncate mt-0.5">{r.last_message || "Start the conversation"}</div>
              </button>
            );
          })
        )}
      </aside>

      {/* Chat area */}
      <div className="flex-1 card flex flex-col overflow-hidden">
        {activeRoom ? (
          <>
            <header className="px-6 py-4 border-b border-line">
              <div className="font-serif text-xl">
                {activeRoom.peers?.[0]?.name || "Customer support"}
              </div>
              <div className="text-xs text-ink-3 mt-0.5">
                {activeRoom.peers?.[0]?.role || "available"}
                {typing && " · typing…"}
              </div>
            </header>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
              {messages.length === 0 ? (
                <div className="text-ink-3 text-sm text-center py-8">
                  Say hello — your dietitian is here to help.
                </div>
              ) : (
                messages.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${mine ? "bg-sage text-white rounded-br-sm" : "bg-cream rounded-bl-sm"}`}>
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={send} className="border-t border-line p-4 flex gap-2">
              <input
                value={text}
                onChange={onType}
                placeholder="Write a message…"
                className="input flex-1"
              />
              <button type="submit" className="btn-primary px-5">
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-ink-3">
            No conversation selected
          </div>
        )}
      </div>
    </div>
  );
}
