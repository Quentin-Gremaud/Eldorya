"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { FogZone, RevealFogZonePayload } from "@/types/api";
import { toast } from "sonner";

interface RevealFogZoneInput {
  fogZoneId: string;
  playerId: string;
  mapLevelId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useRevealFogZone(campaignId: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RevealFogZoneInput) => {
      const payload: RevealFogZonePayload = {
        fogZoneId: input.fogZoneId,
        playerId: input.playerId,
        mapLevelId: input.mapLevelId,
        x: input.x,
        y: input.y,
        width: input.width,
        height: input.height,
        commandId: crypto.randomUUID(),
      };
      return apiFetch<void>(`/api/campaigns/${campaignId}/fog/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },

    onMutate: async (input) => {
      const queryKey = [
        "fog-state",
        campaignId,
        input.playerId,
        input.mapLevelId,
      ];

      await queryClient.cancelQueries({ queryKey, exact: true });

      const previousZones = queryClient.getQueryData<FogZone[]>(queryKey);

      const optimistic: FogZone = {
        id: input.fogZoneId,
        mapLevelId: input.mapLevelId,
        playerId: input.playerId,
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
      if (context?.previousZones) {
        queryClient.setQueryData(context.queryKey, context.previousZones);
      }
      toast.error("Failed to reveal fog zone");
    },

    onSuccess: () => {
      toast.success("Fog zone revealed");
    },

    onSettled: (_data, _error, input) => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: [
            "fog-state",
            campaignId,
            input.playerId,
            input.mapLevelId,
          ],
          exact: true,
        });
      }, 1500);
    },
  });
}
