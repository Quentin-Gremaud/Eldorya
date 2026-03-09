"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { MapLevel } from "@/types/api";

interface SetBackgroundInput {
  backgroundImageUrl: string;
}

export function useSetMapBackground(
  campaignId: string,
  mapLevelId: string
) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SetBackgroundInput) =>
      apiFetch(
        `/api/campaigns/${campaignId}/map-levels/${mapLevelId}/background`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            backgroundImageUrl: input.backgroundImageUrl,
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
            level.id === mapLevelId
              ? { ...level, backgroundImageUrl: input.backgroundImageUrl }
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
