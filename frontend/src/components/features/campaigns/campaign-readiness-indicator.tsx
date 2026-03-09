"use client";

import { CheckCircle } from "lucide-react";
import type { PlayerOnboardingItem } from "@/types/api";

interface CampaignReadinessIndicatorProps {
  players: PlayerOnboardingItem[];
  allReady: boolean;
}

export function CampaignReadinessIndicator({
  players,
  allReady,
}: CampaignReadinessIndicatorProps) {
  if (players.length === 0) {
    return null;
  }

  if (allReady) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
        <CheckCircle className="h-5 w-5 text-emerald-400" />
        <p className="text-sm font-medium text-emerald-400">
          All players are ready! You can launch your first session.
        </p>
      </div>
    );
  }

  const readyCount = players.filter((p) => p.status === "ready").length;
  const totalCount = players.length;

  return (
    <div className="flex items-center gap-2 text-sm text-text-muted">
      <span>
        {readyCount}/{totalCount} players ready
      </span>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-base">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{
            width: `${totalCount > 0 ? (readyCount / totalCount) * 100 : 0}%`,
          }}
        />
      </div>
    </div>
  );
}
