"use client";

import { Badge } from "@/components/ui/badge";
import type { PendingAction } from "@/types/api";
import { Swords, Move, Hand, MessageSquare } from "lucide-react";

const ACTION_TYPE_CONFIG = {
  move: { icon: Move, label: "Move", color: "bg-blue-500/10 text-blue-600" },
  attack: { icon: Swords, label: "Attack", color: "bg-red-500/10 text-red-600" },
  interact: { icon: Hand, label: "Interact", color: "bg-green-500/10 text-green-600" },
  "free-text": { icon: MessageSquare, label: "Free", color: "bg-purple-500/10 text-purple-600" },
} as const;

interface ActionCardProps {
  action: PendingAction;
}

export function ActionCard({ action }: ActionCardProps) {
  const config = ACTION_TYPE_CONFIG[action.actionType];
  const Icon = config.icon;

  const timeAgo = formatTimeAgo(action.proposedAt);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-secondary p-3">
      <div className={`rounded-md p-1.5 ${config.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {config.label}
          </Badge>
          <span className="text-xs text-text-muted">{timeAgo}</span>
        </div>
        <p className="mt-1 text-sm text-text-primary line-clamp-2">
          {action.description}
        </p>
        {action.target && (
          <p className="mt-0.5 text-xs text-text-muted">
            Target: {action.target}
          </p>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}
