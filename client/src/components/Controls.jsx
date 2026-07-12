import { Files, LogOut, Mic, MicOff, MonitorUp, Video, VideoOff } from "lucide-react";

export default function Controls({ mediaState, onMute, onCamera, onScreenShare, onFiles, onLeave }) {
  return (
    <nav className="controls">
      <button className={mediaState.muted ? "danger" : ""} title="Mute microphone" onClick={onMute}>
        {mediaState.muted ? <MicOff size={20} /> : <Mic size={20} />}
      </button>
      <button className={mediaState.cameraOff ? "danger" : ""} title="Toggle camera" onClick={onCamera}>
        {mediaState.cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
      </button>
      <button className={mediaState.screenSharing ? "active" : ""} title="Share screen" onClick={onScreenShare}>
        <MonitorUp size={20} />
      </button>
      <button title="Files" onClick={onFiles}>
        <Files size={20} />
      </button>
      <button className="danger" title="Leave" onClick={onLeave}>
        <LogOut size={20} />
      </button>
    </nav>
  );
}
