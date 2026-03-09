"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { CharacterDetail, CreateCharacterPayload } from "@/types/api";

export function useCreateCharacter(campaignId: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCharacterPayload) =>
      apiFetch(`/api/campaigns/${campaignId}/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: ["campaigns", campaignId, "characters", "me"],
      });

      const previousData = queryClient.getQueryData<CharacterDetail | null>([
        "campaigns",
        campaignId,
        "characters",
        "me",
      ]);

      const optimisticCharacter: CharacterDetail = {
        id: payload.id,
        name: payload.name,
        race: payload.race,
        characterClass: payload.characterClass,
        background: payload.background,
        stats: payload.stats,
        spells: payload.spells,
        status: "pending",
        rejectionReason: null,
        proposedChanges: null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<CharacterDetail | null>(
        ["campaigns", campaignId, "characters", "me"],
        optimisticCharacter
      );

      return { previousData };
    },

    onError: (_err, _payload, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(
          ["campaigns", campaignId, "characters", "me"],
          context.previousData
        );
      }
    },

    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["campaigns", campaignId, "characters", "me"],
        });
      }, 1500);
    },
  });
}
