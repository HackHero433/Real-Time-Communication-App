import VideoTile from "./VideoTile";

export default function VideoGrid({ localStream, remoteStreams, participants, user }) {
  const local = participants.find((participant) => participant.socketId === "local");
  return (
    <section className="video-grid">
      <VideoTile label={`${user.name} (you)`} stream={localStream} muted participant={local} />
      {remoteStreams.map((remote) => {
        const participant = participants.find((entry) => entry.socketId === remote.socketId);
        return (
          <VideoTile
            key={remote.socketId}
            label={participant?.email || remote.socketId.slice(0, 6)}
            stream={remote.stream}
            participant={participant}
          />
        );
      })}
    </section>
  );
}
