import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../utils/api";

export default function ChatPanel({ socket, roomId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    api(`/api/rooms/${roomId}/messages`).then((data) => setMessages(data.messages)).catch(() => null);
  }, [roomId]);

  useEffect(() => {
    if (!socket) return undefined;
    const onMessage = (message) => setMessages((current) => [...current, message]);
    socket.on("chat:message", onMessage);
    return () => socket.off("chat:message", onMessage);
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    socket.emit("chat:message", { roomId, text });
    setText("");
  }

  return (
    <section className="panel chat-panel">
      <h2>Chat</h2>
      <div className="message-list">
        {messages.map((message) => (
          <article key={message.id || message.createdAt} className="message">
            <strong>{message.sender?.name || message.sender?.email || "Participant"}</strong>
            <p>{message.text}</p>
          </article>
        ))}
        <div ref={bottomRef} />
      </div>
      <form className="chat-form" onSubmit={submit}>
        <input value={text} onChange={(event) => setText(event.target.value)} />
        <button title="Send message">
          <Send size={18} />
        </button>
      </form>
    </section>
  );
}
