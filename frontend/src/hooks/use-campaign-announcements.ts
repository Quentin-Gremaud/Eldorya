"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { CampaignAnnouncementsResponse } from "@/types/api";

export function useCampaignAnnouncements(campaignId: string) {
  const apiFetch = useApiClient();

  const { data, isPending, isError } =
    useQuery<CampaignAnnouncementsResponse>({
      queryKey: ["campaigns", campaignId, "announcements"],
      queryFn: () =>
        apiFetch<{ data: CampaignAnnouncementsResponse }>(
          `/api/campaigns/${campaignId}/announcements`
        ).then((res) => res.data),
      enabled: !!campaignId,
      staleTime: 30_000,
    });

  return {
    announcements: data?.announcements ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading: isPending,
    isError,
  };
}
