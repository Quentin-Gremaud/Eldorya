"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { PendingModification } from "./use-pending-modifications";
import { toast } from "sonner";

export function useApproveCharacterModification(campaignId: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (characterId: string) =>
      apiFetch(
        `/api/campaigns/${campaignId}/characters/${characterId}/approve-modification`,
        { method: "POST" }
      ),

    onMutate: async (characterId) => {
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

    onError: (_err, _characterId, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(
          ["campaigns", campaignId, "characters", "pending-modifications"],
          context.previousData
        );
      }
      toast.error("Failed to approve modification");
    },

    onSuccess: () => {
      toast.success("Modification approved!");
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
