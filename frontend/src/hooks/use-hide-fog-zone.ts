"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { FogZone, HideFogZonePayload } from "@/types/api";
import { toast } from "sonner";

interface HideFogZoneInput {
  fogZoneId: string;
  playerId: string;
  mapLevelId: string;
  silent?: boolean;
}

export function useHideFogZone(campaignId: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: HideFogZoneInput) => {
      const payload: HideFogZonePayload = {
        fogZoneId: input.fogZoneId,
        playerId: input.playerId,
        commandId: crypto.randomUUID(),
      };
      return apiFetch<void>(`/api/campaigns/${campaignId}/fog/hide`, {
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

      queryClient.setQueryData<FogZone[]>(queryKey, (old) =>
        (old ?? []).filter((zone) => zone.id !== input.fogZoneId),
      );

      return { previousZones, queryKey };
    },

    onError: (_err, variables, context) => {
      if (context?.previousZones) {
        queryClient.setQueryData(context.queryKey, context.previousZones);
      }
      if (!variables.silent) {
        toast.error("Failed to hide fog zone");
      }
    },

    onSuccess: (_data, variables) => {
      if (!variables.silent) {
        toast.success("Fog zone hidden");
      }
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
