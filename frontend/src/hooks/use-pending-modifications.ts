"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { CharacterSummary, ProposedChange } from "@/types/api";

export interface PendingModification {
  id: string;
  userId: string;
  name: string;
  race: string;
  characterClass: string;
  background: string;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  spells: string[];
  status: string;
  proposedChanges: Record<string, ProposedChange>;
  createdAt: string;
}

export function usePendingModifications(campaignId: string) {
  const apiFetch = useApiClient();

  const { data, isPending, isError } = useQuery<PendingModification[]>({
    queryKey: ["campaigns", campaignId, "characters", "pending-modifications"],
    queryFn: async () => {
      const res = await apiFetch<{ data: PendingModification[] }>(
        `/api/campaigns/${campaignId}/characters/pending-modifications`
      );
      return res.data;
    },
    enabled: !!campaignId,
    staleTime: 30_000,
  });

  return {
    modifications: data ?? [],
    isLoading: isPending,
    isError,
  };
}
