"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { MapLevel } from "@/types/api";
import { toast } from "sonner";

interface RenameMapLevelInput {
  mapLevelId: string;
  newName: string;
}

export function useRenameMapLevel(campaignId: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RenameMapLevelInput) =>
      apiFetch(
        `/api/campaigns/${campaignId}/map-levels/${input.mapLevelId}/rename`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: input.newName,
            commandId: crypto.randomUUID(),
          }),
        }
      ),

    onMutate: async (input) => {
      await queryClient.cancelQueries({
        queryKey: ["map-levels", campaignId],
        exact: true,
      });

      const previousMapLevels = queryClient.getQueryData<MapLevel[]>([
        "map-levels",
        campaignId,
      ]);

      queryClient.setQueryData<MapLevel[]>(
        ["map-levels", campaignId],
        (old) =>
          (old ?? []).map((level) =>
            level.id === input.mapLevelId
              ? { ...level, name: input.newName, updatedAt: new Date().toISOString() }
              : level
          )
      );

      return { previousMapLevels };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousMapLevels) {
        queryClient.setQueryData(
          ["map-levels", campaignId],
          context.previousMapLevels
        );
      }
      toast.error("Failed to rename map level");
    },

    onSuccess: () => {
      toast.success("Map level renamed!");
    },

    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["map-levels", campaignId],
          exact: true,
        });
      }, 1500);
    },
  });
}
