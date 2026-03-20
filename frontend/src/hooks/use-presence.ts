"use client";

import { useEffect, useState, useCallback } from "react";
import { useWebSocketContext } from "@/providers/web-socket-provider";
import { WS_EVENTS } from "@/lib/ws/ws-event-types";
import type { PlayerPresence, PresenceStatus } from "@/types/api";

interface PresenceChangedPayload {
  type: string;
  data: {
    sessionId: string;
    userId: string;
    status: PresenceStatus;
  };
}

interface PresenceSnapshotPayload {
  type: string;
  data: {
    sessionId: string;
    presences: PlayerPresence[];
  };
}

export function usePresence(sessionId: string) {
  const { socket } = useWebSocketContext();
  const [presences, setPresences] = useState<Map<string, PlayerPresence>>(
    new Map()
  );

  const handlePresenceChanged = useCallback(
    (payload: PresenceChangedPayload) => {
      if (!payload?.data?.sessionId) return;
      if (payload.data.sessionId !== sessionId) return;

      setPresences((prev) => {
        const next = new Map(prev);
        next.set(payload.data.userId, {
          userId: payload.data.userId,
          sessionId: payload.data.sessionId,
          status: payload.data.status,
        });
        return next;
      });
    },
    [sessionId]
  );

  const handlePresenceSnapshot = useCallback(
    (payload: PresenceSnapshotPayload) => {
      if (!payload?.data?.sessionId) return;
      if (payload.data.sessionId !== sessionId) return;

      const newMap = new Map<string, PlayerPresence>();
      for (const p of payload.data.presences) {
        newMap.set(p.userId, p);
      }
      setPresences(newMap);
    },
    [sessionId]
  );

  useEffect(() => {
    socket.on(WS_EVENTS.PresenceChanged, handlePresenceChanged);
    socket.on(WS_EVENTS.PresenceSnapshot, handlePresenceSnapshot);

    return () => {
      socket.off(WS_EVENTS.PresenceChanged, handlePresenceChanged);
      socket.off(WS_EVENTS.PresenceSnapshot, handlePresenceSnapshot);
    };
  }, [socket, handlePresenceChanged, handlePresenceSnapshot]);

  return {
    presences: Array.from(presences.values()),
    getPresence: (userId: string): PresenceStatus =>
      presences.get(userId)?.status ?? "disconnected",
  };
}
