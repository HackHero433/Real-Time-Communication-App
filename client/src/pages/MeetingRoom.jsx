import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import { useSocket } from "../hooks/useSocket";
import { useWebRTC } from "../hooks/useWebRTC";
import VideoGrid from "../components/VideoGrid";
import Controls from "../components/Controls";
import ChatPanel from "../components/ChatPanel";
import Whiteboard from "../components/Whiteboard";
import FileShareModal from "../components/FileShareModal";
import ParticipantList from "../components/ParticipantList";

export default function MeetingRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket(Boolean(user));
  const call = useWebRTC(socket, roomId, user);
  const [room, setRoom] = useState(null);
  const [filesOpen, setFilesOpen] = useState(false);
  const createdRoomPassword = location.state?.createdRoomPassword || "";
  const roomRequiresPassword = location.state?.roomRequiresPassword || false;

  useEffect(() => {
    api(`/api/rooms/${roomId}`)
      .then((data) => setRoom({ ...data.room, requiresPassword: data.requiresPassword }))
      .catch(() => navigate("/"));
  }, [navigate, roomId]);

  return (
    <main className="meeting-shell">
      <section className="call-stage">
        <header className="meeting-header">
          <div>
            <h1>{room?.name || roomId}</h1>
            <span>{roomId}</span>
            {(room?.requiresPassword || roomRequiresPassword) && (
              <div className="meeting-secret">
                <strong>Password protected</strong>
                <span>
                  {createdRoomPassword ? `Join password: ${createdRoomPassword}` : "Only the host knows the join password."}
                </span>
              </div>
            )}
          </div>
          <ParticipantList participants={call.participants} />
        </header>
        <VideoGrid
          localStream={call.localStream}
          remoteStreams={call.remoteStreams}
          participants={call.participants}
          user={user}
        />
        <Controls
          mediaState={call.mediaState}
          onMute={call.toggleMute}
          onCamera={call.toggleCamera}
          onScreenShare={call.toggleScreenShare}
          onFiles={() => setFilesOpen(true)}
          onLeave={() => navigate("/")}
        />
      </section>
      <aside className="side-rail">
        <ChatPanel socket={socket} roomId={roomId} />
        <Whiteboard socket={socket} roomId={roomId} userId={user.id} />
      </aside>
      {filesOpen && <FileShareModal roomId={roomId} onClose={() => setFilesOpen(false)} />}
    </main>
  );
}
