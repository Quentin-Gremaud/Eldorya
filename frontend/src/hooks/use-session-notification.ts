"use client";

import { useEffect, useState } from "react";
import { useWebSocketContext } from "@/providers/web-socket-provider";
import { WS_EVENTS } from "@/lib/ws/ws-event-types";

interface SessionModePayload {
  type: string;
  data: {
    sessionId: string;
    campaignId: string;
    mode: string;
  };
}

export function useSessionNotification(campaignId: string) {
  const { socket } = useWebSocketContext();
  const [isSessionLive, setIsSessionLive] = useState(false);
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    const handleSessionModeLive = (payload: SessionModePayload) => {
      if (!payload?.data?.campaignId) return;
      if (payload.data.campaignId !== campaignId) return;
      setIsSessionLive(true);
      setLiveSessionId(payload.data.sessionId);
    };

    const handleSessionModePreparation = (payload: SessionModePayload) => {
      if (!payload?.data?.campaignId) return;
      if (payload.data.campaignId !== campaignId) return;
      setIsSessionLive(false);
      setLiveSessionId(null);
    };

    socket.on(WS_EVENTS.SessionModeLive, handleSessionModeLive);
    socket.on(WS_EVENTS.SessionModePreparation, handleSessionModePreparation);

    return () => {
      socket.off(WS_EVENTS.SessionModeLive, handleSessionModeLive);
      socket.off(WS_EVENTS.SessionModePreparation, handleSessionModePreparation);
    };
  }, [socket, campaignId]);

  return {
    isSessionLive,
    liveSessionId,
  };
}
