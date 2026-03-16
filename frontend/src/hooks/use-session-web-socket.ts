"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocketContext } from "@/providers/web-socket-provider";
import { WS_EVENTS } from "@/lib/ws/ws-event-types";
import type { Session } from "@/types/api";

interface SessionModePayload {
  type: string;
  data: {
    sessionId: string;
    campaignId: string;
    mode: string;
  };
}

export function useSessionWebSocket(campaignId: string) {
  const { socket } = useWebSocketContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    const queryKey = ["session", campaignId, "active"];

    const handleSessionModeLive = (payload: SessionModePayload) => {
      if (!payload?.data?.campaignId) return;
      if (payload.data.campaignId !== campaignId) return;

      queryClient.setQueryData<Session | null>(queryKey, (old) => {
        if (!old) return old;
        return { ...old, mode: "live" };
      });
    };

    const handleSessionModePreparation = (payload: SessionModePayload) => {
      if (!payload?.data?.campaignId) return;
      if (payload.data.campaignId !== campaignId) return;

      queryClient.setQueryData<Session | null>(queryKey, (old) => {
        if (!old) return old;
        return { ...old, mode: "preparation" };
      });
    };

    socket.on(WS_EVENTS.SessionModeLive, handleSessionModeLive);
    socket.on(WS_EVENTS.SessionModePreparation, handleSessionModePreparation);

    return () => {
      socket.off(WS_EVENTS.SessionModeLive, handleSessionModeLive);
      socket.off(WS_EVENTS.SessionModePreparation, handleSessionModePreparation);
    };
  }, [socket, campaignId, queryClient]);
}
