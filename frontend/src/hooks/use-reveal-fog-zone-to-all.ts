"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { FogZone, RevealFogZoneToAllPayload } from "@/types/api";
import { toast } from "sonner";

interface RevealFogZoneToAllInput extends Omit<RevealFogZoneToAllPayload, "commandId"> {
  previewPlayerId?: string | null;
}

export function useRevealFogZoneToAll(campaignId: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RevealFogZoneToAllInput) => {
      const payload = {
        fogZoneId: input.fogZoneId,
        mapLevelId: input.mapLevelId,
        x: input.x,
        y: input.y,
        width: input.width,
        height: input.height,
        commandId: crypto.randomUUID(),
      };
      return apiFetch<void>(`/api/campaigns/${campaignId}/fog/reveal-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },

    onMutate: async (input) => {
      if (!input.previewPlayerId) return {};

      const queryKey = [
        "fog-state",
        campaignId,
        input.previewPlayerId,
        input.mapLevelId,
      ];

      await queryClient.cancelQueries({ queryKey, exact: true });

      const previousZones = queryClient.getQueryData<FogZone[]>(queryKey);

      const optimistic: FogZone = {
        id: input.fogZoneId,
        mapLevelId: input.mapLevelId,
        playerId: input.previewPlayerId,
        x: input.x,
        y: input.y,
        width: input.width,
        height: input.height,
        revealed: true,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<FogZone[]>(queryKey, (old) => [
        ...(old ?? []),
        optimistic,
      ]);

      return { previousZones, queryKey };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousZones && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousZones);
      }
      toast.error("Failed to reveal fog zone to all players");
    },

    onSuccess: () => {
      toast.success("Fog zone revealed to all players");
    },

    onSettled: (_data, _error, input) => {
      if (!input.previewPlayerId) return;
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: [
            "fog-state",
            campaignId,
            input.previewPlayerId,
            input.mapLevelId,
          ],
          exact: true,
        });
      }, 1500);
    },
  });
}
