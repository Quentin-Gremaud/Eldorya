"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { PendingCharacterDetail } from "@/types/api";
import { toast } from "sonner";

export function useApproveCharacter(campaignId: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (characterId: string) =>
      apiFetch(`/api/campaigns/${campaignId}/characters/${characterId}/approve`, {
        method: "POST",
      }),

    onMutate: async (characterId) => {
      await queryClient.cancelQueries({
        queryKey: ["campaigns", campaignId, "characters", "pending"],
      });

      const previousData = queryClient.getQueryData<PendingCharacterDetail[]>([
        "campaigns",
        campaignId,
        "characters",
        "pending",
      ]);

      queryClient.setQueryData<PendingCharacterDetail[]>(
        ["campaigns", campaignId, "characters", "pending"],
        (old) => (old ?? []).filter((c) => c.id !== characterId)
      );

      return { previousData };
    },

    onError: (_err, _characterId, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(
          ["campaigns", campaignId, "characters", "pending"],
          context.previousData
        );
      }
      toast.error("Failed to approve character");
    },

    onSuccess: () => {
      toast.success("Character approved!");
    },

    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["campaigns", campaignId, "characters", "pending"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["campaigns", campaignId, "characters"],
        });
      }, 1500);
    },
  });
}
