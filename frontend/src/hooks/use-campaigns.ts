"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { CampaignSummary } from "@/types/api";

export function useCampaigns() {
  const apiFetch = useApiClient();

  const { data, isPending, isError } = useQuery<CampaignSummary[]>({
    queryKey: ["campaigns"],
    queryFn: () => apiFetch<{ data: CampaignSummary[] }>("/api/campaigns").then(
      (res) => res.data
    ),
  });

  return {
    campaigns: data ?? [],
    isLoading: isPending,
    isError,
  };
}
