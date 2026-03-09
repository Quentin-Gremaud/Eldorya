"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";

export function useActiveCampaignCount() {
  const apiFetch = useApiClient();

  const { data, isPending, isError } = useQuery<number>({
    queryKey: ["campaigns", "active-count"],
    queryFn: () =>
      apiFetch<{ count: number }>("/api/campaigns/active-count").then(
        (res) => res.count
      ),
    staleTime: 30_000,
  });

  return {
    activeCount: data,
    isLoading: isPending,
    isError,
  };
}
