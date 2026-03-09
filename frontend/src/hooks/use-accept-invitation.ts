"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useApiClient } from "@/lib/api/use-api-client";

interface AcceptInvitationResponse {
  campaignId: string;
}

export function useAcceptInvitation(token: string) {
  const apiFetch = useApiClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<{ data: AcceptInvitationResponse }>(
        `/api/invitations/${token}/accept`,
        { method: "POST" }
      ),
    onSuccess: (result) => {
      router.push(`/campaign/${result.data.campaignId}/player/session`);
    },
  });

  return {
    accept: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
