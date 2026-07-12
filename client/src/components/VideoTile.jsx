import { MicOff, MonitorUp, VideoOff } from "lucide-react";
import { useEffect, useRef } from "react";

export default function VideoTile({ stream, label, muted = false, participant }) {
  const videoRef = useRef(null);
  const state = participant?.mediaState || {};

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <article className={`video-tile ${state.speaking ? "speaking" : ""}`}>
      {stream && !state.cameraOff ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} />
      ) : (
        <div className="avatar-tile">{label.slice(0, 1).toUpperCase()}</div>
      )}
      <div className="tile-footer">
        <span>{label}</span>
        <div className="tile-icons">
          {state.screenSharing && <MonitorUp size={16} />}
          {state.muted && <MicOff size={16} />}
          {state.cameraOff && <VideoOff size={16} />}
        </div>
      </div>
    </article>
  );
}
