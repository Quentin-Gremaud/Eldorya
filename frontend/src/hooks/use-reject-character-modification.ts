"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { PendingModification } from "./use-pending-modifications";
import { toast } from "sonner";

interface RejectModificationParams {
  characterId: string;
  reason: string;
}

export function useRejectCharacterModification(campaignId: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ characterId, reason }: RejectModificationParams) =>
      apiFetch(
        `/api/campaigns/${campaignId}/characters/${characterId}/reject-modification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      ),

    onMutate: async ({ characterId }) => {
      await queryClient.cancelQueries({
        queryKey: [
          "campaigns",
          campaignId,
          "characters",
          "pending-modifications",
        ],
      });

      const previousData = queryClient.getQueryData<PendingModification[]>([
        "campaigns",
        campaignId,
        "characters",
        "pending-modifications",
      ]);

      queryClient.setQueryData<PendingModification[]>(
        ["campaigns", campaignId, "characters", "pending-modifications"],
        (old) => (old ?? []).filter((c) => c.id !== characterId)
      );

      return { previousData };
    },

    onError: (_err, _params, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(
          ["campaigns", campaignId, "characters", "pending-modifications"],
          context.previousData
        );
      }
      toast.error("Failed to reject modification");
    },

    onSuccess: () => {
      toast.success("Modification rejected with feedback");
    },

    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: [
            "campaigns",
            campaignId,
            "characters",
            "pending-modifications",
          ],
        });
        void queryClient.invalidateQueries({
          queryKey: ["campaigns", campaignId, "characters"],
        });
      }, 1500);
    },
  });
}
