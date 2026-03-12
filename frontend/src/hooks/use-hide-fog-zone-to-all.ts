"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { FogZone, HideFogZoneToAllPayload } from "@/types/api";
import { toast } from "sonner";

interface HideFogZoneToAllInput {
  fogZoneId: string;
  mapLevelId: string;
  previewPlayerId?: string | null;
  silent?: boolean;
}

export function useHideFogZoneToAll(campaignId: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: HideFogZoneToAllInput) => {
      const payload: HideFogZoneToAllPayload = {
        fogZoneId: input.fogZoneId,
        commandId: crypto.randomUUID(),
      };
      return apiFetch<void>(`/api/campaigns/${campaignId}/fog/hide-all`, {
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

      queryClient.setQueryData<FogZone[]>(queryKey, (old) =>
        (old ?? []).filter((zone) => zone.id !== input.fogZoneId),
      );

      return { previousZones, queryKey };
    },

    onError: (_err, variables, context) => {
      if (context?.previousZones && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousZones);
      }
      if (!variables.silent) {
        toast.error("Failed to hide fog zone for all players");
      }
    },

    onSuccess: (_data, variables) => {
      if (!variables.silent) {
        toast.success("Fog zone hidden for all players");
      }
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
