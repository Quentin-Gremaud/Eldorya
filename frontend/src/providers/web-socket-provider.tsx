"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@clerk/nextjs";
import type { Socket } from "socket.io-client";
import { createAuthenticatedSocket } from "@/lib/ws/socket-client";

type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

interface WebSocketContextValue {
  socket: Socket;
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within WebSocketProvider");
  }
  return context;
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  const socket = useMemo(
    () => createAuthenticatedSocket(getToken),
    [getToken],
  );

  useEffect(() => {
    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("disconnected"));
    socket.io.on("reconnect_attempt", () => setStatus("reconnecting"));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [socket]);

  const connect = useCallback(() => {
    socket.connect();
  }, [socket]);

  const disconnect = useCallback(() => {
    socket.disconnect();
  }, [socket]);

  return (
    <WebSocketContext.Provider value={{ socket, status, connect, disconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
}
