"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { MapLevel } from "@/types/api";

export function useMapLevels(campaignId: string) {
  const apiFetch = useApiClient();

  const { data, isPending, isError } = useQuery<MapLevel[]>({
    queryKey: ["map-levels", campaignId],
    queryFn: () =>
      apiFetch<{ data: MapLevel[] }>(
        `/api/campaigns/${campaignId}/map-levels`
      ).then((res) => res.data),
    enabled: !!campaignId,
  });

  return {
    mapLevels: data ?? [],
    isLoading: isPending,
    isError,
  };
}
