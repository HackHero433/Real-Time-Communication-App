import { useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../utils/api";

export function useSocket(enabled = true) {
  const socket = useMemo(() => {
    if (!enabled) return null;
    return io(API_URL, {
      withCredentials: true,
      auth: { token: localStorage.getItem("accessToken") },
      autoConnect: false
    });
  }, [enabled]);

  useEffect(() => {
    if (!socket) return undefined;
    socket.connect();
    return () => socket.disconnect();
  }, [socket]);

  return socket;
}
