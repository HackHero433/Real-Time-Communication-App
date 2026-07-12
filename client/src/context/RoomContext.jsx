import { createContext, useContext, useMemo, useState } from "react";

const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const [activeRoom, setActiveRoom] = useState(null);
  const value = useMemo(() => ({ activeRoom, setActiveRoom }), [activeRoom]);
  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom() {
  return useContext(RoomContext);
}
