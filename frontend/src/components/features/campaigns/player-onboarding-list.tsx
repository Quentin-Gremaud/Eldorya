"use client";

import { Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelativeDate } from "@/lib/utils";
import type { PlayerOnboardingItem } from "@/types/api";

interface PlayerOnboardingListProps {
  players: PlayerOnboardingItem[];
  hasActiveInvitation: boolean;
  isLoading: boolean;
}

function PlayerInitialsAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-primary/20 text-sm font-medium text-accent-primary">
      {initial}
    </div>
  );
}

function StatusBadge({ status }: { status: "joined" | "ready" }) {
  if (status === "ready") {
    return (
      <Badge className="border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
        Ready
      </Badge>
    );
  }
  return (
    <Badge className="border-amber-500/30 bg-amber-500/20 text-amber-400">
      Joined
    </Badge>
  );
}

function PlayerOnboardingListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function PlayerOnboardingList({
  players,
  hasActiveInvitation,
  isLoading,
}: PlayerOnboardingListProps) {
  if (isLoading) {
    return <PlayerOnboardingListSkeleton />;
  }

  if (players.length === 0 && !hasActiveInvitation) {
    return (
      <EmptyState
        icon={<Users className="h-10 w-10" />}
        title="No players yet"
        description="Generate an invitation link above to invite players"
      />
    );
  }

  if (players.length === 0 && hasActiveInvitation) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 text-text-secondary">
          <Clock className="h-8 w-8 animate-pulse" />
        </div>
        <p className="text-sm text-text-secondary">
          Waiting for players to join via invitation link
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasActiveInvitation && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          <p className="text-xs text-amber-400">
            An invitation link is active — more players may join
          </p>
        </div>
      )}

      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.userId}
            className="flex items-center gap-3 rounded-md border border-border bg-surface-base px-3 py-2"
          >
            <PlayerInitialsAvatar name={player.displayName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">
                {player.displayName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={player.status} />
              <span className="text-xs text-text-muted">
                {formatRelativeDate(player.joinedAt) ?? "recently"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
