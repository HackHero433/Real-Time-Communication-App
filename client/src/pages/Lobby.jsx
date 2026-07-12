import { useEffect, useState } from "react";
import { LogOut, Plus, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";

export default function Lobby() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("Team sync");
  const [createPassword, setCreatePassword] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/rooms/history").then((data) => setHistory(data.rooms)).catch(() => null);
  }, []);

  async function createRoom(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await api("/api/rooms", {
        method: "POST",
        body: JSON.stringify({ name: roomName, joinPassword: createPassword.trim() || undefined })
      });
      navigate(`/rooms/${data.room.roomId}`, {
        state: {
          createdRoomPassword: createPassword.trim(),
          roomRequiresPassword: Boolean(createPassword.trim())
        }
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function joinRoom(event) {
    event.preventDefault();
    setError("");
    try {
      const normalized = joinCode.trim().toUpperCase();
      await api(`/api/rooms/${normalized}/join`, {
        method: "POST",
        body: JSON.stringify({ joinPassword })
      });
      navigate(`/rooms/${normalized}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="lobby">
      <header className="topbar">
        <div>
          <h1>Realtime Comm</h1>
          <span>{user.name}</span>
        </div>
        <button className="icon-button" title="Sign out" onClick={() => logout().then(() => navigate("/login"))}>
          <LogOut size={18} />
        </button>
      </header>

      <section className="lobby-grid">
        <form className="panel" onSubmit={createRoom}>
          <h2>Start a room</h2>
          <label>
            Meeting name
            <input value={roomName} onChange={(event) => setRoomName(event.target.value)} />
          </label>
          <label>
            Room password
            <input
              type="password"
              placeholder="Optional"
              value={createPassword}
              onChange={(event) => setCreatePassword(event.target.value)}
            />
          </label>
          <p className="helper-text">Set this only if you want members to enter both a room code and password.</p>
          <button type="submit">
            <Plus size={18} /> Create room
          </button>
        </form>

        <form className="panel" onSubmit={joinRoom}>
          <h2>Join a room</h2>
          <label>
            Room code
            <input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} />
          </label>
          <label>
            Password
            <input value={joinPassword} onChange={(event) => setJoinPassword(event.target.value)} />
          </label>
          <button type="submit">
            <Video size={18} /> Join call
          </button>
          {error && <p className="error">{error}</p>}
        </form>

        <section className="panel history-panel">
          <h2>Meeting history</h2>
          {history.length === 0 && <p className="muted">No rooms yet.</p>}
          {history.map((room) => (
            <button className="history-row" key={room.roomId} onClick={() => navigate(`/rooms/${room.roomId}`)}>
              <span>{room.name}</span>
              <small>
                {room.roomId} · {room.participantCount} participants
              </small>
            </button>
          ))}
        </section>
      </section>
    </main>
  );
}
