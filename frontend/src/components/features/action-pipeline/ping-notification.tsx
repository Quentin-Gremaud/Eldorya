"use client";

import { usePingNotification } from "@/hooks/use-ping-notification";
import { Bell } from "lucide-react";

interface PingNotificationProps {
  campaignId: string;
}

export function PingNotification({ campaignId }: PingNotificationProps) {
  const { isPinged, clearPing } = usePingNotification(campaignId);

  if (!isPinged) return null;

  return (
    <div
      className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 animate-pulse"
      role="alert"
    >
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5 text-amber-500" />
        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
          The Master awaits your action!
        </span>
      </div>
      <button
        onClick={clearPing}
        className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
      >
        Dismiss
      </button>
    </div>
  );
}
