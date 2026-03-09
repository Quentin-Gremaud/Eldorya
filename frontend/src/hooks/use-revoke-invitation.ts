"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { CampaignInvitation } from "@/lib/api/invitations-api";

export function useRevokeInvitation(campaignId: string) {
  const queryClient = useQueryClient();
  const apiFetch = useApiClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      await apiFetch(
        `/api/campaigns/${campaignId}/invitations/${invitationId}`,
        { method: "DELETE" }
      );
    },

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["campaigns", campaignId, "invitation"],
      });

      const previous = queryClient.getQueryData<CampaignInvitation | null>([
        "campaigns",
        campaignId,
        "invitation",
      ]);

      queryClient.setQueryData(
        ["campaigns", campaignId, "invitation"],
        null
      );

      return { previous };
    },

    onError: (_err, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          ["campaigns", campaignId, "invitation"],
          context.previous
        );
      }
    },

    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["campaigns", campaignId, "invitation"],
        });
      }, 1500);
    },
  });
}
