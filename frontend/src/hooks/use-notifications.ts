"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { NotificationsResponse } from "@/types/api";

export function useNotifications() {
  const apiFetch = useApiClient();

  const { data, isPending, isError } = useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: () =>
      apiFetch<{ data: NotificationsResponse }>("/api/notifications").then(
        (res) => res.data
      ),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading: isPending,
    isError,
  };
}
