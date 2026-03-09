"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { CharacterDetail, ProposedChange } from "@/types/api";
import { toast } from "sonner";

export interface RequestModificationInput {
  proposedChanges: Record<string, ProposedChange>;
  reason?: string;
}

export function useRequestCharacterModification(
  campaignId: string,
  characterId: string
) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RequestModificationInput) =>
      apiFetch(
        `/api/campaigns/${campaignId}/characters/${characterId}/request-modification`,
        {
          method: "POST",
          body: JSON.stringify({
            ...input,
            commandId: crypto.randomUUID(),
          }),
        }
      ),

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["campaigns", campaignId, "characters", "me"],
      });

      const previousCharacter = queryClient.getQueryData<CharacterDetail>([
        "campaigns",
        campaignId,
        "characters",
        "me",
      ]);

      if (previousCharacter) {
        queryClient.setQueryData<CharacterDetail>(
          ["campaigns", campaignId, "characters", "me"],
          {
            ...previousCharacter,
            status: "pending_revalidation",
          }
        );
      }

      return { previousCharacter };
    },

    onError: (_err, _input, context) => {
      if (context?.previousCharacter) {
        queryClient.setQueryData(
          ["campaigns", campaignId, "characters", "me"],
          context.previousCharacter
        );
      }
      toast.error("Failed to submit modification request");
    },

    onSuccess: () => {
      toast.success("Modification request submitted for GM review");
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
