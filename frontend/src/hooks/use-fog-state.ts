"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { useWebSocketContext } from "@/providers/web-socket-provider";
import { WS_EVENTS } from "@/lib/ws/ws-event-types";
import type { FogZone } from "@/types/api";

interface FogZoneEventPayload {
  type: string;
  data: {
    campaignId: string;
    playerId: string;
    fogZoneId: string;
    mapLevelId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    revealedAt: string;
  };
  metadata: {
    campaignId: string;
    sessionId: string;
    timestamp: string;
  };
}

export function useFogState(
  campaignId: string,
  playerId: string | null,
  mapLevelId: string | null
) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();
  const { socket } = useWebSocketContext();

  const queryKey = useMemo(
    () => ["fog-state", campaignId, playerId, mapLevelId],
    [campaignId, playerId, mapLevelId]
  );

  const query = useQuery<FogZone[]>({
    queryKey,
    queryFn: async () => {
      if (!playerId || !mapLevelId) return [];
      try {
        const data = await apiFetch<{ data: FogZone[] }>(
          `/api/campaigns/${campaignId}/maps/${mapLevelId}/fog?playerId=${playerId}`
        );
        return data.data;
      } catch (error: unknown) {
        if (
          error &&
          typeof error === "object" &&
          "statusCode" in error &&
          (error as { statusCode: number }).statusCode === 404
        ) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!playerId && !!mapLevelId,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!playerId || !mapLevelId) return;

    const handleFogZoneRevealed = (payload: FogZoneEventPayload) => {
      try {
        const { data } = payload;
        if (
          data.campaignId !== campaignId ||
          data.playerId !== playerId ||
          data.mapLevelId !== mapLevelId
        ) {
          return;
        }

        queryClient.setQueryData<FogZone[]>(queryKey, (old = []) => {
          if (old.some((z) => z.id === data.fogZoneId)) return old;
          return [
            ...old,
            {
              id: data.fogZoneId,
              mapLevelId: data.mapLevelId,
              playerId: data.playerId,
              x: data.x,
              y: data.y,
              width: data.width,
              height: data.height,
              revealed: true,
              createdAt: data.revealedAt,
            },
          ];
        });
      } catch (err) {
        console.error("[useFogState] Error handling FogZoneRevealed:", err);
      }
    };

    const handleFogZoneHidden = (payload: FogZoneEventPayload) => {
      try {
        const { data } = payload;
        if (
          data.campaignId !== campaignId ||
          data.playerId !== playerId ||
          data.mapLevelId !== mapLevelId
        ) {
          return;
        }

        queryClient.setQueryData<FogZone[]>(queryKey, (old = []) =>
          old.filter((z) => z.id !== data.fogZoneId)
        );
      } catch (err) {
        console.error("[useFogState] Error handling FogZoneHidden:", err);
      }
    };

    socket.on(WS_EVENTS.FogZoneRevealed, handleFogZoneRevealed);
    socket.on(WS_EVENTS.FogZoneHidden, handleFogZoneHidden);

    return () => {
      socket.off(WS_EVENTS.FogZoneRevealed, handleFogZoneRevealed);
      socket.off(WS_EVENTS.FogZoneHidden, handleFogZoneHidden);
    };
  }, [socket, campaignId, playerId, mapLevelId, queryClient, queryKey]);

  return {
    fogZones: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
