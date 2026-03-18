"use client";

import { useState, useCallback } from "react";
import { usePendingActions } from "@/hooks/use-pending-actions";
import { useActionPipelineWebSocket } from "@/hooks/use-action-pipeline-web-socket";
import { useValidateAction } from "@/hooks/use-validate-action";
import { useRejectAction } from "@/hooks/use-reject-action";
import { ActionCard } from "./action-card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Inbox } from "lucide-react";
import type { PendingAction } from "@/types/api";

interface PendingActionQueueProps {
  campaignId: string;
  sessionId: string;
  isGm: boolean;
}

export function PendingActionQueue({
  campaignId,
  sessionId,
  isGm,
}: PendingActionQueueProps) {
  const { actions } = usePendingActions(campaignId, sessionId);
  const [collapsed, setCollapsed] = useState(false);
  const [flashingActions, setFlashingActions] = useState<Map<string, PendingAction>>(new Map());

  const validateAction = useValidateAction();
  const rejectAction = useRejectAction();

  // Real-time updates via WebSocket
  useActionPipelineWebSocket(campaignId, sessionId);

  const handleApprove = useCallback(
    (actionId: string, narrativeNote?: string) => {
      const action = actions.find((a) => a.id === actionId);
      if (action) {
        setFlashingActions((prev) => new Map(prev).set(actionId, action));
      }
      validateAction.mutate({
        campaignId,
        sessionId,
        actionId,
        narrativeNote,
      });
    },
    [campaignId, sessionId, validateAction.mutate, actions]
  );

  const handleReject = useCallback(
    (actionId: string, feedback: string) => {
      const action = actions.find((a) => a.id === actionId);
      if (action) {
        setFlashingActions((prev) => new Map(prev).set(actionId, action));
      }
      rejectAction.mutate({
        campaignId,
        sessionId,
        actionId,
        feedback,
      });
    },
    [campaignId, sessionId, rejectAction.mutate, actions]
  );

  const handleRemove = useCallback((actionId: string) => {
    setFlashingActions((prev) => {
      const next = new Map(prev);
      next.delete(actionId);
      return next;
    });
  }, []);

  // Merge: cache actions (excluding flashing ones) + flashing snapshots
  const visibleActions = [
    ...actions.filter((a) => !flashingActions.has(a.id)),
    ...Array.from(flashingActions.values()),
  ];

  return (
    <div className="absolute top-4 right-4 z-10 w-80 rounded-lg border border-border bg-surface shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <h3 className="text-sm font-medium text-text-primary">
          Pending Actions ({actions.length})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand queue" : "Collapse queue"}
        >
          {collapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </div>

      {!collapsed && (
        <div className="max-h-96 overflow-y-auto p-3 space-y-2">
          {visibleActions.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Inbox className="h-8 w-8 text-text-muted mb-2" />
              <p className="text-sm text-text-muted">No pending actions</p>
            </div>
          ) : (
            visibleActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                isGm={isGm}
                onApprove={handleApprove}
                onReject={handleReject}
                onRemove={handleRemove}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
