"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { CampaignInvitation } from "@/lib/api/invitations-api";

export function useCampaignInvitation(campaignId: string) {
  const apiFetch = useApiClient();

  const { data, isPending, isError } = useQuery<CampaignInvitation | null>({
    queryKey: ["campaigns", campaignId, "invitation"],
    queryFn: () =>
      apiFetch<{ data: CampaignInvitation | null }>(
        `/api/campaigns/${campaignId}/invitation`
      ).then((res) => res.data),
    enabled: !!campaignId,
  });

  return {
    invitation: data ?? null,
    isLoading: isPending,
    isError,
  };
}
