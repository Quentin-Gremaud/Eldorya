"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { NotificationsResponse } from "@/types/api";

export function useMarkNotificationRead() {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      apiFetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      }),

    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      const previousData =
        queryClient.getQueryData<NotificationsResponse>(["notifications"]);

      queryClient.setQueryData<NotificationsResponse>(
        ["notifications"],
        (old) => {
          if (!old) return old;
          const updated = old.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          );
          const unreadCount = updated.filter((n) => !n.isRead).length;
          return { notifications: updated, unreadCount };
        }
      );

      return { previousData };
    },

    onError: (_err, _notificationId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["notifications"], context.previousData);
      }
    },

    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }, 1500);
    },
  });
}
