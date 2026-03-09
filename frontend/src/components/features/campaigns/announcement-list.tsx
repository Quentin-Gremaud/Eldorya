"use client";

import { Megaphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelativeDate } from "@/lib/utils";
import type { CampaignAnnouncement } from "@/types/api";

interface AnnouncementListProps {
  announcements: CampaignAnnouncement[];
  isLoading: boolean;
  role: "gm" | "player";
}

function AnnouncementListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-md border border-border bg-surface-base p-3"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-1 h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function AnnouncementList({
  announcements,
  isLoading,
  role,
}: AnnouncementListProps) {
  if (isLoading) {
    return <AnnouncementListSkeleton />;
  }

  if (announcements.length === 0) {
    return (
      <EmptyState
        icon={<Megaphone className="h-10 w-10" />}
        title="No announcements yet"
        description={
          role === "gm"
            ? "Send your first announcement to your players"
            : "No announcements from your GM yet"
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className="rounded-md border border-border bg-surface-base p-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">
              {announcement.gmDisplayName}
            </span>
            <span className="text-xs text-text-muted">
              {formatRelativeDate(announcement.createdAt) ?? "just now"}
            </span>
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-sm text-text-secondary">
            {announcement.content}
          </p>
        </div>
      ))}
    </div>
  );
}
