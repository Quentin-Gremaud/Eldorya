"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { Inventory } from "@/types/api";

export function useInventory(characterId: string) {
  const apiFetch = useApiClient();

  const { data, isPending, isError } = useQuery<Inventory>({
    queryKey: ["characters", characterId, "inventory"],
    queryFn: () =>
      apiFetch<{ data: Inventory }>(
        `/api/characters/${characterId}/inventory`
      ).then((res) => res.data),
    enabled: !!characterId,
  });

  return {
    inventory: data ?? null,
    isLoading: isPending,
    isError,
  };
}
