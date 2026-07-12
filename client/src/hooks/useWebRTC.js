import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { rtcConfiguration } from "../utils/webrtcConfig";

export function useWebRTC(socket, roomId, user) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [mediaState, setMediaState] = useState({ muted: false, cameraOff: false, screenSharing: false, speaking: false });
  const localStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const peers = useRef(new Map());
  const audioAnalyser = useRef(null);
  const mediaStateRef = useRef(mediaState);
  const socketRef = useRef(socket);

  useEffect(() => {
    mediaStateRef.current = mediaState;
  }, [mediaState]);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  const upsertRemote = useCallback((socketId, stream) => {
    setRemoteStreams((current) => {
      const without = current.filter((entry) => entry.socketId !== socketId);
      return [...without, { socketId, stream }];
    });
  }, []);

  const createPeer = useCallback(
    (socketId) => {
      const existing = peers.current.get(socketId);
      if (existing) return existing;
      const peer = new RTCPeerConnection(rtcConfiguration);
      peers.current.set(socketId, peer);

      localStreamRef.current?.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current);
      });

      peer.ontrack = (event) => upsertRemote(socketId, event.streams[0]);
      peer.onicecandidate = (event) => {
        if (event.candidate) socket.emit("signal:ice-candidate", { to: socketId, candidate: event.candidate });
      };
      peer.oniceconnectionstatechange = () => {
        if (["failed", "disconnected"].includes(peer.iceConnectionState)) {
          peer.restartIce?.();
        }
      };
      return peer;
    },
    [socket, upsertRemote]
  );

  const callParticipant = useCallback(
    async (socketId) => {
      const peer = createPeer(socketId);
      const offer = await peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await peer.setLocalDescription(offer);
      socket.emit("signal:offer", { to: socketId, offer });
    },
    [createPeer, socket]
  );

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!mounted) return;
        localStreamRef.current = stream;
        cameraStreamRef.current = stream;
        setLocalStream(stream);
        startAudioMeter(stream);
      })
      .catch(() => navigator.mediaDevices.getUserMedia({ audio: true }))
      .then((stream) => {
        if (stream && mounted && !localStreamRef.current) {
          localStreamRef.current = stream;
          cameraStreamRef.current = stream;
          setLocalStream(stream);
          startAudioMeter(stream);
        }
      })
      .catch(console.error);
    return () => {
      mounted = false;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioAnalyser.current?.close?.();
    };
  }, []);

  useEffect(() => {
    if (!socket || !roomId || !localStream) return undefined;

    socket.emit("join-room", { roomId, userId: user.id, mediaState: mediaStateRef.current });
    socket.on("room:participants", (existing) => {
      setParticipants(existing);
      existing.forEach((participant) => callParticipant(participant.socketId));
    });
    socket.on("user:joined", (participant) => {
      setParticipants((current) => [...dedupeParticipants(current), participant]);
    });
    socket.on("user:left", ({ socketId }) => {
      peers.current.get(socketId)?.close();
      peers.current.delete(socketId);
      setRemoteStreams((current) => current.filter((entry) => entry.socketId !== socketId));
      setParticipants((current) => current.filter((entry) => entry.socketId !== socketId));
    });
    socket.on("signal:offer", async ({ from, offer }) => {
      const peer = createPeer(from);
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("signal:answer", { to: from, answer });
    });
    socket.on("signal:answer", async ({ from, answer }) => {
      const peer = peers.current.get(from);
      if (peer) await peer.setRemoteDescription(new RTCSessionDescription(answer));
    });
    socket.on("signal:ice-candidate", async ({ from, candidate }) => {
      const peer = peers.current.get(from);
      if (peer && candidate) await peer.addIceCandidate(new RTCIceCandidate(candidate));
    });
    socket.on("media:state", ({ socketId, mediaState: nextState }) => {
      setParticipants((current) =>
        current.map((entry) => (entry.socketId === socketId ? { ...entry, mediaState: nextState } : entry))
      );
    });

    return () => {
      socket.emit("leave-room", { roomId, userId: user.id });
      socket.off("room:participants");
      socket.off("user:joined");
      socket.off("user:left");
      socket.off("signal:offer");
      socket.off("signal:answer");
      socket.off("signal:ice-candidate");
      socket.off("media:state");
      peers.current.forEach((peer) => peer.close());
      peers.current.clear();
    };
  }, [callParticipant, createPeer, localStream, roomId, socket, user.id]);

  const toggleMute = useCallback(() => {
    const nextMuted = !mediaStateRef.current.muted;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    const next = { ...mediaStateRef.current, muted: nextMuted };
    setMediaState(next);
    socket?.emit("media:state", next);
  }, [socket]);

  const toggleCamera = useCallback(() => {
    const nextCameraOff = !mediaStateRef.current.cameraOff;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !nextCameraOff;
    });
    const next = { ...mediaStateRef.current, cameraOff: nextCameraOff };
    setMediaState(next);
    socket?.emit("media:state", next);
  }, [socket]);

  const stopScreenShare = useCallback(async () => {
    const cameraStream = cameraStreamRef.current || (await navigator.mediaDevices.getUserMedia({ video: true, audio: true }));
    const cameraTrack = cameraStream.getVideoTracks()[0];
    if (cameraTrack) await replaceVideoTrack(cameraTrack);
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      if (track !== cameraTrack) track.stop();
    });
    localStreamRef.current = cameraStream;
    setLocalStream(cameraStream);
    const next = { ...mediaStateRef.current, screenSharing: false };
    setMediaState(next);
    socketRef.current?.emit("screen-share:stop", { roomId, userId: user.id });
    socketRef.current?.emit("media:state", next);
  }, [roomId, user.id]);

  const toggleScreenShare = useCallback(async () => {
    if (mediaStateRef.current.screenSharing) {
      await stopScreenShare();
      return;
    }

    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    const screenTrack = screenStream.getVideoTracks()[0];
    await replaceVideoTrack(screenTrack);
    const mixed = new MediaStream([screenTrack, ...localStreamRef.current.getAudioTracks()]);
    localStreamRef.current = mixed;
    setLocalStream(mixed);
    screenTrack.onended = () => {
      if (mediaStateRef.current.screenSharing) stopScreenShare();
    };
    const next = { ...mediaStateRef.current, screenSharing: true };
      setMediaState(next);
      socket.emit("screen-share:start", { roomId, userId: user.id });
      socket.emit("media:state", next);
  }, [roomId, socket, stopScreenShare, user.id]);

  async function replaceVideoTrack(track) {
    await Promise.all(
      [...peers.current.values()].map(async (peer) => {
        const sender = peer.getSenders().find((item) => item.track?.kind === "video");
        if (sender) await sender.replaceTrack(track);
      })
    );
  }

  function startAudioMeter(stream) {
    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) return;
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    const source = context.createMediaStreamSource(new MediaStream(audioTracks));
    const data = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);
    audioAnalyser.current = context;

    const tick = () => {
      if (!localStreamRef.current) return;
      analyser.getByteFrequencyData(data);
      const average = data.reduce((sum, value) => sum + value, 0) / data.length;
      const speaking = average > 18 && !mediaStateRef.current.muted;
      setMediaState((current) => {
        if (current.speaking === speaking) return current;
        const next = { ...current, speaking };
        socketRef.current?.emit("media:state", next);
        return next;
      });
      requestAnimationFrame(tick);
    };
    tick();
  }

  const localParticipant = useMemo(
    () => ({ socketId: "local", userId: user.id, email: user.email, mediaState }),
    [mediaState, user.email, user.id]
  );

  return {
    localStream,
    remoteStreams,
    participants: [localParticipant, ...participants],
    mediaState,
    toggleMute,
    toggleCamera,
    toggleScreenShare
  };
}

function dedupeParticipants(participants) {
  const seen = new Set();
  return participants.filter((participant) => {
    if (seen.has(participant.socketId)) return false;
    seen.add(participant.socketId);
    return true;
  });
}
