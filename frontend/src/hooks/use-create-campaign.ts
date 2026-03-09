"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createCampaign } from "@/lib/api/campaigns-api";
import { CampaignSummary } from "@/types/api";

interface CreateCampaignInput {
  id: string;
  name: string;
  description?: string;
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required. Please sign in again.");
      }
      await createCampaign(input, token);
      return input;
    },

    onMutate: async (newCampaign) => {
      await queryClient.cancelQueries({
        queryKey: ["campaigns"],
        exact: true,
      });
      await queryClient.cancelQueries({
        queryKey: ["campaigns", "active-count"],
        exact: true,
      });

      const previousCampaigns = queryClient.getQueryData<CampaignSummary[]>([
        "campaigns",
      ]);
      const previousCount = queryClient.getQueryData<number>([
        "campaigns",
        "active-count",
      ]);

      const optimistic: CampaignSummary = {
        id: newCampaign.id,
        name: newCampaign.name,
        description: newCampaign.description ?? null,
        coverImageUrl: null,
        status: "active",
        role: "gm",
        playerCount: 0,
        lastSessionDate: null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<CampaignSummary[]>(
        ["campaigns"],
        (old) => [...(old ?? []), optimistic]
      );

      if (previousCount !== undefined) {
        queryClient.setQueryData<number>(
          ["campaigns", "active-count"],
          previousCount + 1
        );
      }

      return { previousCampaigns, previousCount };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousCampaigns) {
        queryClient.setQueryData(["campaigns"], context.previousCampaigns);
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(
          ["campaigns", "active-count"],
          context.previousCount
        );
      }
    },

    onSettled: (_data, _error, variables) => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["campaigns"],
          exact: true,
        });
        void queryClient.invalidateQueries({
          queryKey: ["campaigns", "active-count"],
          exact: true,
        });
      }, 1500);

      if (!_error && variables) {
        router.push(`/campaign/${variables.id}/gm/prep`);
      }
    },
  });
}
