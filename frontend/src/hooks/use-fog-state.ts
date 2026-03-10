"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { FogZone } from "@/types/api";

export function useFogState(
  campaignId: string,
  playerId: string | null,
  mapLevelId: string | null
) {
  const apiFetch = useApiClient();

  const query = useQuery<FogZone[]>({
    queryKey: ["fog-state", campaignId, playerId, mapLevelId],
    queryFn: async () => {
      if (!playerId || !mapLevelId) return [];
      try {
        const data = await apiFetch<{ data: FogZone[] }>(
          `/api/campaigns/${campaignId}/fog-state?playerId=${playerId}&mapLevelId=${mapLevelId}`
        );
        return data.data;
      } catch (error: unknown) {
        // API doesn't exist yet (Epic 5) — 404 means no fog = all visible
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

  // WebSocket integration point for Epic 5:
  // When WS_EVENTS.FogRevealed and WS_EVENTS.FogHidden are implemented,
  // subscribe here and use queryClient.setQueryData to update fog zones in cache.
  // Example:
  //   const queryClient = useQueryClient();
  //   useEffect(() => {
  //     const unsubReveal = socketClient.on(WS_EVENTS.FogRevealed, (data) => {
  //       queryClient.setQueryData(["fog-state", campaignId, playerId, mapLevelId], ...);
  //     });
  //     return () => unsubReveal();
  //   }, [campaignId, playerId, mapLevelId]);

  return {
    fogZones: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
