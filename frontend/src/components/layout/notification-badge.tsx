"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationPanel } from "./notification-panel";

export function NotificationBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(true)}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-black">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
      <NotificationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
