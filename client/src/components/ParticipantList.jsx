import { MicOff, MonitorUp, Radio, VideoOff } from "lucide-react";

export default function ParticipantList({ participants }) {
  return (
    <div className="participants">
      {participants.map((participant) => (
        <div className="participant-pill" key={participant.socketId}>
          <Radio size={14} />
          <span>{participant.email || participant.userId}</span>
          {participant.mediaState?.speaking && <strong>speaking</strong>}
          {participant.mediaState?.screenSharing && <MonitorUp size={14} />}
          {participant.mediaState?.muted && <MicOff size={14} />}
          {participant.mediaState?.cameraOff && <VideoOff size={14} />}
        </div>
      ))}
    </div>
  );
}
