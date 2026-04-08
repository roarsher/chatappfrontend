// client/src/components/ChatWindow.jsx
import { useState, useEffect } from "react";
import { socket } from "../utils/socket";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ selectedUser }) {
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("typing", () => {
      setTyping(true);
      setTimeout(() => setTyping(false), 1000);
    });
  }, []);

  const sendMessage = () => {
    if (!msg || !selectedUser) return;

    socket.emit("sendMessage", {
      to: selectedUser,
      text: msg,
    });

    setMessages((prev) => [
      ...prev,
      { text: msg, me: true }
    ]);

    setMsg("");
  };

  return (
    <div className="chat-box">
      <div className="messages">
        {messages.map((m, i) => (
          <MessageBubble key={i} msg={m} me={m.me} />
        ))}
      </div>

      {typing && <p className="typing">Typing...</p>}

      <div className="input-box">
        <input
          value={msg}
          onChange={(e) => {
            setMsg(e.target.value);
            socket.emit("typing", { to: selectedUser });
          }}
          placeholder="Type message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}