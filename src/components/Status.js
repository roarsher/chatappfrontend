// client/src/components/Status.jsx
import { useEffect, useState } from "react";

export default function Status() {
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    fetch("https://chatappbackend-4bim.onrender.com/api/status", {
      headers: {
        Authorization: localStorage.getItem("token"),
      },
    })
      .then((res) => res.json())
      .then((data) => setStatuses(data));
  }, []);

  return (
    <div>
      <h3>Status</h3>

      <div style={{ display: "flex", gap: "10px" }}>
        {statuses.map((s, i) => (
          <div key={i} className="status">
            <img
              src={`https://chatappbackend-4bim.onrender.com/uploads/${s.image}`}
              alt="status"
            />
          </div>
        ))}
      </div>
    </div>
  );
}