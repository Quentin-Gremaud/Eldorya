"use client";

import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PendingAction } from "@/types/api";
import { Swords, Move, Hand, MessageSquare, Check, X, Zap, GripVertical } from "lucide-react";

const ACTION_TYPE_CONFIG = {
  move: { icon: Move, label: "Move", color: "bg-blue-500/10 text-blue-600" },
  attack: { icon: Swords, label: "Attack", color: "bg-red-500/10 text-red-600" },
  interact: { icon: Hand, label: "Interact", color: "bg-green-500/10 text-green-600" },
  "free-text": { icon: MessageSquare, label: "Free", color: "bg-purple-500/10 text-purple-600" },
} as const;

type CardState = "default" | "approving" | "rejecting" | "flash-approved" | "flash-rejected";

interface ActionCardProps {
  action: PendingAction;
  isGm?: boolean;
  onApprove?: (actionId: string, narrativeNote?: string) => void;
  onReject?: (actionId: string, feedback: string) => void;
  onRemove?: (actionId: string) => void;
}

export function ActionCard({ action, isGm, onApprove, onReject, onRemove }: ActionCardProps) {
  const config = ACTION_TYPE_CONFIG[action.actionType];
  const Icon = config.icon;
  const timeAgo = formatTimeAgo(action.proposedAt);

  const [cardState, setCardState] = useState<CardState>("default");
  const [narrativeNote, setNarrativeNote] = useState("");
  const [feedback, setFeedback] = useState("");

  const isDragDisabled = cardState !== "default";
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: action.id,
    disabled: isDragDisabled,
  });

  useEffect(() => {
    if (cardState === "flash-approved" || cardState === "flash-rejected") {
      const timer = setTimeout(() => {
        onRemove?.(action.id);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [cardState, action.id, onRemove]);

  const handleValidate = () => setCardState("approving");
  const handleOneClickApprove = () => {
    onApprove?.(action.id);
    setCardState("flash-approved");
  };
  const handleConfirmApprove = () => {
    onApprove?.(action.id, narrativeNote || undefined);
    setCardState("flash-approved");
  };
  const handleRejectStart = () => setCardState("rejecting");
  const handleConfirmReject = () => {
    if (!feedback.trim()) return;
    onReject?.(action.id, feedback);
    setCardState("flash-rejected");
  };
  const handleCancel = () => {
    setCardState("default");
    setNarrativeNote("");
    setFeedback("");
  };

  const flashClass =
    cardState === "flash-approved"
      ? "ring-2 ring-emerald-500 bg-emerald-500/10 motion-safe:animate-pulse"
      : cardState === "flash-rejected"
        ? "ring-2 ring-red-500 bg-red-500/10 motion-safe:animate-pulse"
        : "";

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.15)" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      className={`flex flex-col gap-2 rounded-lg border border-border bg-surface-secondary p-3 transition-all duration-300 ${flashClass}`}
      role="article"
      aria-label={`Action: ${action.description}`}
      {...attributes}
    >
      <div className="flex items-start gap-3">
        {isGm && (
          <button
            className="mt-1 cursor-grab touch-none text-text-muted hover:text-text-primary active:cursor-grabbing"
            aria-label="Drag to reorder action"
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
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

      {isGm && cardState === "default" && (
        <div className="flex gap-2 mt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
            onClick={handleValidate}
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Validate
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
            onClick={handleRejectStart}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Reject
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
            onClick={handleOneClickApprove}
            aria-label="One-click approve"
          >
            <Zap className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {isGm && cardState === "approving" && (
        <div className="space-y-2 mt-1">
          <Textarea
            placeholder="Add a narrative note (optional)..."
            value={narrativeNote}
            onChange={(e) => setNarrativeNote(e.target.value)}
            maxLength={1000}
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmApprove}
            >
              Confirm
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isGm && cardState === "rejecting" && (
        <div className="space-y-2 mt-1">
          <Textarea
            placeholder="Explain why this action is rejected..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            maxLength={1000}
            rows={2}
            className="text-sm"
            required
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmReject}
              disabled={!feedback.trim()}
            >
              Confirm Reject
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}
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
