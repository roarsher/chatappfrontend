// client/src/components/MessageBubble.jsx
export default function MessageBubble({ msg, me }) {
  return (
    <div className={me ? "message me" : "message"}>
      {msg.text || "📎 File"}

      {/* Seen tick */}
      {me && (
        <span className={msg.seen ? "seen blue" : "seen"}>
          ✔✔
        </span>
      )}
    </div>
  );
}