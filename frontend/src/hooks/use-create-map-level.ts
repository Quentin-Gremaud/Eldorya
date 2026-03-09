"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { MapLevel } from "@/types/api";
import { toast } from "sonner";

interface CreateMapLevelInput {
  mapLevelId: string;
  name: string;
  parentId?: string;
}

export function useCreateMapLevel(campaignId: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMapLevelInput) =>
      apiFetch(`/api/campaigns/${campaignId}/map-levels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapLevelId: input.mapLevelId,
          name: input.name,
          parentId: input.parentId,
          commandId: crypto.randomUUID(),
        }),
      }),

    onMutate: async (input) => {
      await queryClient.cancelQueries({
        queryKey: ["map-levels", campaignId],
        exact: true,
      });

      const previousMapLevels = queryClient.getQueryData<MapLevel[]>([
        "map-levels",
        campaignId,
      ]);

      const existingLevels = previousMapLevels ?? [];
      let depth = 0;
      if (input.parentId) {
        const parent = existingLevels.find((l) => l.id === input.parentId);
        if (parent) depth = parent.depth + 1;
      }

      const now = new Date().toISOString();
      const optimistic: MapLevel = {
        id: input.mapLevelId,
        campaignId,
        name: input.name,
        parentId: input.parentId ?? null,
        depth,
        backgroundImageUrl: null,
        createdAt: now,
        updatedAt: now,
      };

      queryClient.setQueryData<MapLevel[]>(
        ["map-levels", campaignId],
        (old) => [...(old ?? []), optimistic]
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
      toast.error("Failed to create map level");
    },

    onSuccess: () => {
      toast.success("Map level created!");
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
