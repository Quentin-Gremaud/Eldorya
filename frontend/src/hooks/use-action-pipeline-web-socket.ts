"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocketContext } from "@/providers/web-socket-provider";
import { WS_EVENTS } from "@/lib/ws/ws-event-types";
import type { PendingAction, PingStatus } from "@/types/api";

interface ActionProposedPayload {
  type: string;
  data: {
    actionId: string;
    sessionId: string;
    campaignId: string;
    playerId: string;
    actionType: string;
    description: string;
    target: string | null;
    proposedAt: string;
  };
}

interface PingPayload {
  type: string;
  data: {
    sessionId: string;
    campaignId: string;
    playerId: string;
  };
  metadata?: {
    timestamp?: string;
  };
}

interface ActionConfirmationPayload {
  type: string;
  data: {
    actionId: string;
    sessionId: string;
    campaignId: string;
  };
}

interface ActionPipelineWebSocketOptions {
  onActionConfirmed?: (actionId: string) => void;
}

export function useActionPipelineWebSocket(
  campaignId: string,
  sessionId: string,
  options?: ActionPipelineWebSocketOptions
) {
  const { socket } = useWebSocketContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    const pendingKey = ["actions", campaignId, sessionId, "pending"];
    const pingStatusKey = ["actions", campaignId, sessionId, "ping-status"];

    const handlePlayerPinged = (payload: PingPayload) => {
      if (payload.data.campaignId !== campaignId) return;

      queryClient.setQueryData<PingStatus | null>(pingStatusKey, {
        playerId: payload.data.playerId,
        pingedAt: payload.metadata?.timestamp ?? new Date().toISOString(),
      });
    };

    const handlePlayerPingedGm = (payload: PingPayload) => {
      if (payload.data.campaignId !== campaignId) return;

      queryClient.setQueryData<PingStatus | null>(pingStatusKey, {
        playerId: payload.data.playerId,
        pingedAt: payload.metadata?.timestamp ?? new Date().toISOString(),
      });
    };

    const handleActionProposed = (payload: ActionProposedPayload) => {
      if (payload.data.campaignId !== campaignId) return;

      const newAction: PendingAction = {
        id: payload.data.actionId,
        sessionId: payload.data.sessionId,
        campaignId: payload.data.campaignId,
        playerId: payload.data.playerId,
        actionType: payload.data.actionType as PendingAction["actionType"],
        description: payload.data.description,
        target: payload.data.target,
        status: "pending",
        proposedAt: payload.data.proposedAt,
      };

      queryClient.setQueryData<PendingAction[]>(pendingKey, (old) => {
        const existing = old ?? [];
        if (existing.some((a) => a.id === newAction.id)) return existing;
        return [...existing, newAction];
      });
    };

    const handleActionProposedConfirmation = (
      payload: ActionConfirmationPayload
    ) => {
      if (payload.data.campaignId !== campaignId) return;
      options?.onActionConfirmed?.(payload.data.actionId);
    };

    socket.on(WS_EVENTS.PlayerPinged, handlePlayerPinged);
    socket.on(WS_EVENTS.PlayerPingedGm, handlePlayerPingedGm);
    socket.on(WS_EVENTS.ActionProposed, handleActionProposed);
    socket.on(
      WS_EVENTS.ActionProposedConfirmation,
      handleActionProposedConfirmation
    );

    return () => {
      socket.off(WS_EVENTS.PlayerPinged, handlePlayerPinged);
      socket.off(WS_EVENTS.PlayerPingedGm, handlePlayerPingedGm);
      socket.off(WS_EVENTS.ActionProposed, handleActionProposed);
      socket.off(
        WS_EVENTS.ActionProposedConfirmation,
        handleActionProposedConfirmation
      );
    };
  }, [socket, campaignId, sessionId, queryClient, options?.onActionConfirmed]);
}
