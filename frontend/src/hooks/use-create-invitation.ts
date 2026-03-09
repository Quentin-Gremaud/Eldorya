"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type {
  CampaignInvitation,
  CreateInvitationResponse,
} from "@/lib/api/invitations-api";

export function useCreateInvitation(campaignId: string) {
  const queryClient = useQueryClient();
  const apiFetch = useApiClient();

  return useMutation({
    mutationFn: async (expiresInDays: number = 7) => {
      const result = await apiFetch<{ data: CreateInvitationResponse }>(
        `/api/campaigns/${campaignId}/invitations`,
        {
          method: "POST",
          body: JSON.stringify({ expiresInDays }),
        }
      );
      return result.data;
    },

    onMutate: async (expiresInDays: number = 7) => {
      await queryClient.cancelQueries({
        queryKey: ["campaigns", campaignId, "invitation"],
      });

      const previous = queryClient.getQueryData<CampaignInvitation | null>([
        "campaigns",
        campaignId,
        "invitation",
      ]);

      queryClient.setQueryData<CampaignInvitation | null>(
        ["campaigns", campaignId, "invitation"],
        {
          id: `temp-${Date.now()}`,
          campaignId,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(
            Date.now() + expiresInDays * 24 * 60 * 60 * 1000
          ).toISOString(),
          status: "active",
        }
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
