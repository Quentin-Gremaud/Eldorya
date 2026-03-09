"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { CampaignAnnouncementsResponse, CampaignAnnouncement } from "@/types/api";

interface SendAnnouncementPayload {
  id: string;
  content: string;
}

export function useSendAnnouncement(campaignId: string, gmDisplayName: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendAnnouncementPayload) =>
      apiFetch(`/api/campaigns/${campaignId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: ["campaigns", campaignId, "announcements"],
      });

      const previousData =
        queryClient.getQueryData<CampaignAnnouncementsResponse>([
          "campaigns",
          campaignId,
          "announcements",
        ]);

      const optimisticAnnouncement: CampaignAnnouncement = {
        id: payload.id,
        content: payload.content,
        gmDisplayName,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<CampaignAnnouncementsResponse>(
        ["campaigns", campaignId, "announcements"],
        (old) => ({
          announcements: [
            optimisticAnnouncement,
            ...(old?.announcements ?? []),
          ],
          totalCount: (old?.totalCount ?? 0) + 1,
        })
      );

      return { previousData };
    },

    onError: (_err, _payload, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ["campaigns", campaignId, "announcements"],
          context.previousData
        );
      }
    },

    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["campaigns", campaignId, "announcements"],
        });
      }, 1500);
    },
  });
}
