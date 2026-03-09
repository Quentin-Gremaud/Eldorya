"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { CampaignSummary } from "@/types/api";

export function useArchiveCampaign(campaignId: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch(`/api/campaigns/${campaignId}/archive`, {
        method: "POST",
      }),

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["campaigns", campaignId],
      });
      await queryClient.cancelQueries({
        queryKey: ["campaigns"],
      });

      const previousDetail = queryClient.getQueryData(["campaigns", campaignId]);
      const previousList = queryClient.getQueryData<CampaignSummary[]>(["campaigns"]);

      queryClient.setQueryData(["campaigns", campaignId], (old: Record<string, unknown> | undefined) =>
        old ? { ...old, status: "archived" } : old
      );

      queryClient.setQueryData<CampaignSummary[]>(["campaigns"], (old) =>
        old?.map((c) =>
          c.id === campaignId ? { ...c, status: "archived" } : c
        )
      );

      return { previousDetail, previousList };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(["campaigns", campaignId], context.previousDetail);
      }
      if (context?.previousList) {
        queryClient.setQueryData(["campaigns"], context.previousList);
      }
    },

    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["campaigns", campaignId] });
        queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      }, 1500);
    },
  });
}
