"use client";

import { useEffect, useState } from "react";
import { useWebSocketContext } from "@/providers/web-socket-provider";
import { WS_EVENTS } from "@/lib/ws/ws-event-types";

interface PingPayload {
  type: string;
  data: {
    sessionId: string;
    campaignId: string;
    playerId: string;
  };
}

export function usePingNotification(campaignId: string) {
  const { socket } = useWebSocketContext();
  const [isPinged, setIsPinged] = useState(false);

  useEffect(() => {
    const handlePlayerPinged = (payload: PingPayload) => {
      if (payload.data.campaignId !== campaignId) return;
      setIsPinged(true);
    };

    socket.on(WS_EVENTS.PlayerPinged, handlePlayerPinged);

    return () => {
      socket.off(WS_EVENTS.PlayerPinged, handlePlayerPinged);
    };
  }, [socket, campaignId]);

  // Auto-dismiss ping notification after 30 seconds
  useEffect(() => {
    if (!isPinged) return;

    const timeout = setTimeout(() => {
      setIsPinged(false);
    }, 30_000);

    return () => clearTimeout(timeout);
  }, [isPinged]);

  const clearPing = () => setIsPinged(false);

  return { isPinged, clearPing };
}
