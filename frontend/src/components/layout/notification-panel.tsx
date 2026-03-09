"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Megaphone, CheckCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { useNotifications } from "@/hooks/use-notifications";
import { useMarkNotificationRead } from "@/hooks/use-mark-notification-read";
import { formatRelativeDate } from "@/lib/utils";
import type { NotificationItem } from "@/types/api";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function NotificationTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "campaign_announcement":
      return <Megaphone className="h-4 w-4 text-accent-primary" />;
    default:
      return <Bell className="h-4 w-4 text-text-secondary" />;
  }
}

function NotificationItemRow({
  notification,
  onClickNotification,
}: {
  notification: NotificationItem;
  onClickNotification: (notification: NotificationItem) => void;
}) {
  return (
    <button
      onClick={() => onClickNotification(notification)}
      className={`w-full rounded-md border px-3 py-2.5 text-left transition-colors hover:bg-surface-hover ${
        notification.isRead
          ? "border-border bg-surface-base"
          : "border-accent-primary/30 bg-accent-primary/5"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5">
          <NotificationTypeIcon type={notification.type} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm ${
              notification.isRead
                ? "text-text-secondary"
                : "font-medium text-text-primary"
            }`}
          >
            {notification.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">
            {notification.content}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {formatRelativeDate(notification.createdAt) ?? "just now"}
          </p>
        </div>
        {!notification.isRead && (
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-primary" />
        )}
      </div>
    </button>
  );
}

function getNotificationRoute(notification: NotificationItem): string | null {
  if (!notification.campaignId) return null;
  switch (notification.type) {
    case "campaign_announcement":
      return `/campaign/${notification.campaignId}/player`;
    default:
      return `/campaign/${notification.campaignId}/player`;
  }
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const router = useRouter();
  const { notifications, unreadCount } = useNotifications();
  const markRead = useMarkNotificationRead();

  const handleClickNotification = (notification: NotificationItem) => {
    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }
    const route = getNotificationRoute(notification);
    if (route) {
      router.push(route);
      onClose();
    }
  };

  const handleMarkAllRead = useCallback(() => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    // Mark sequentially to avoid snapshot corruption
    let chain = Promise.resolve();
    for (const n of unread) {
      chain = chain.then(
        () =>
          new Promise<void>((resolve) => {
            markRead.mutate(n.id, { onSettled: () => resolve() });
          })
      );
    }
  }, [notifications, markRead]);

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-[380px] sm:w-[420px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-xs"
              >
                <CheckCheck className="mr-1 h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>
          <SheetDescription className="sr-only">
            Your recent notifications
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {notifications.length === 0 ? (
            <EmptyState
              icon={<Bell className="h-10 w-10" />}
              title="No notifications"
              description="You're all caught up"
            />
          ) : (
            notifications.map((notification) => (
              <NotificationItemRow
                key={notification.id}
                notification={notification}
                onClickNotification={handleClickNotification}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
