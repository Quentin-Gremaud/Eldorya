"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useClerk } from "@clerk/nextjs";
import { useCallback } from "react";
import { useApiClient } from "@/lib/api/use-api-client";
import { ActiveCampaignsResponse } from "@/lib/api/account-api";

export function useAccountDeletion() {
  const apiFetch = useApiClient();
  const { signOut } = useClerk();

  const activeCampaignsQuery = useQuery({
    queryKey: ["account", "active-campaigns"],
    queryFn: () =>
      apiFetch<ActiveCampaignsResponse>("/api/account/active-campaigns").then(
        (res) => res.data
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch<void>("/api/account", { method: "DELETE" }),
    onSuccess: () => {
      signOut({ redirectUrl: "/" });
    },
  });

  const handleDelete = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

  return {
    activeCampaigns: activeCampaignsQuery.data ?? { count: 0, campaigns: [] },
    isLoadingCampaigns: activeCampaignsQuery.isPending,
    deleteAccount: handleDelete,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}
