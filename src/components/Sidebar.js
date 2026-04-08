// client/src/components/Sidebar.jsx
import { useEffect, useState } from "react";
import { socket } from "../utils/socket";

export default function Sidebar({ setSelectedUser }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    socket.on("onlineUsers", (data) => {
      setUsers(data);
    });
  }, []);

  return (
    <div className="sidebar">
      <h2>Online Users</h2>

      {users.map((user, i) => (
        <div
          key={i}
          className="user"
          onClick={() => setSelectedUser(user)}
        >
          🟢 {user}
        </div>
      ))}
    </div>
  );
}