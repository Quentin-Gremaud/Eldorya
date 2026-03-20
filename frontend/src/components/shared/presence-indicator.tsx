"use client";

import { cn } from "@/lib/utils";
import type { PresenceStatus } from "@/types/api";

interface PresenceIndicatorProps {
  displayName: string;
  status: PresenceStatus;
  size?: "sm" | "md";
}

const statusStyles: Record<PresenceStatus, string> = {
  online: "ring-2 ring-emerald-500",
  idle: "ring-2 ring-muted opacity-50",
  disconnected: "ring-2 ring-muted border-dashed opacity-50",
  "action-pending": "ring-2 ring-amber-500 animate-pulse",
};

const statusDotStyles: Record<PresenceStatus, string> = {
  online: "bg-emerald-500",
  idle: "bg-muted-foreground",
  disconnected: "bg-muted-foreground",
  "action-pending": "bg-amber-500",
};

export function PresenceIndicator({
  displayName,
  status,
  size = "md",
}: PresenceIndicatorProps) {
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizeClasses = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";

  return (
    <div className="relative inline-block" title={`${displayName} (${status})`}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted font-medium text-text-primary",
          sizeClasses,
          statusStyles[status]
        )}
        aria-label={`${displayName}: ${status}`}
      >
        {initials}
      </div>
      <span
        className={cn(
          "absolute -bottom-0.5 -right-0.5 block rounded-full",
          size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5",
          statusDotStyles[status]
        )}
      />
    </div>
  );
}
