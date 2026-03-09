"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type {
  CharacterDetailForGm,
  ModifyCharacterByGmPayload,
  CharacterSummary,
} from "@/types/api";
import { toast } from "sonner";

export function useModifyCharacterByGm(campaignId: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      characterId,
      modifications,
    }: {
      characterId: string;
      modifications: ModifyCharacterByGmPayload;
    }) =>
      apiFetch(
        `/api/campaigns/${campaignId}/characters/${characterId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(modifications),
        }
      ),

    onMutate: async ({ characterId, modifications }) => {
      await queryClient.cancelQueries({
        queryKey: ["campaigns", campaignId, "characters", characterId],
      });

      const previousCharacter =
        queryClient.getQueryData<CharacterDetailForGm>([
          "campaigns",
          campaignId,
          "characters",
          characterId,
        ]);

      if (previousCharacter) {
        queryClient.setQueryData<CharacterDetailForGm>(
          ["campaigns", campaignId, "characters", characterId],
          { ...previousCharacter, ...modifications }
        );
      }

      const previousList = queryClient.getQueryData<CharacterSummary[]>([
        "campaigns",
        campaignId,
        "characters",
      ]);

      if (previousList) {
        queryClient.setQueryData<CharacterSummary[]>(
          ["campaigns", campaignId, "characters"],
          previousList.map((c) =>
            c.id === characterId ? { ...c, ...modifications } : c
          )
        );
      }

      return { previousCharacter, previousList };
    },

    onError: (_err, { characterId }, context) => {
      if (context?.previousCharacter !== undefined) {
        queryClient.setQueryData(
          ["campaigns", campaignId, "characters", characterId],
          context.previousCharacter
        );
      }
      if (context?.previousList !== undefined) {
        queryClient.setQueryData(
          ["campaigns", campaignId, "characters"],
          context.previousList
        );
      }
      toast.error("Failed to modify character");
    },

    onSuccess: () => {
      toast.success("Character modified successfully");
    },

    onSettled: (_data, _err, { characterId }) => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["campaigns", campaignId, "characters", characterId],
        });
        void queryClient.invalidateQueries({
          queryKey: ["campaigns", campaignId, "characters"],
        });
      }, 1500);
    },
  });
}
