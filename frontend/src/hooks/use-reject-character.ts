"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { PendingCharacterDetail } from "@/types/api";
import { toast } from "sonner";

interface RejectCharacterParams {
  characterId: string;
  reason: string;
}

export function useRejectCharacter(campaignId: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ characterId, reason }: RejectCharacterParams) =>
      apiFetch(`/api/campaigns/${campaignId}/characters/${characterId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      }),

    onMutate: async ({ characterId }) => {
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

    onError: (_err, _params, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(
          ["campaigns", campaignId, "characters", "pending"],
          context.previousData
        );
      }
      toast.error("Failed to reject character");
    },

    onSuccess: () => {
      toast.success("Character rejected with feedback");
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
