"use client";

import { useCallback, useState } from "react";
import { useProposeAction } from "@/hooks/use-propose-action";
import { useCancelAction } from "@/hooks/use-cancel-action";
import { usePipelineMode } from "@/hooks/use-pipeline-mode";
import { useActionPipelineWebSocket } from "@/hooks/use-action-pipeline-web-socket";
import { useActionOutcomeNotification } from "@/hooks/use-action-outcome-notification";
import { ActionToolbar } from "./action-toolbar";
import { ActionOutcomeNotification } from "./action-outcome-notification";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, X } from "lucide-react";
import type { ActionType } from "@/types/api";

interface ActionSubmissionPanelProps {
  campaignId: string;
  sessionId: string;
  isPinged?: boolean;
}

export function ActionSubmissionPanel({
  campaignId,
  sessionId,
  isPinged = false,
}: ActionSubmissionPanelProps) {
  const proposeAction = useProposeAction();
  const cancelAction = useCancelAction();
  const { pipelineMode } = usePipelineMode(campaignId, sessionId);
  const [waitingForGm, setWaitingForGm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const { outcome, onActionValidated, onActionRejected, clearOutcome } =
    useActionOutcomeNotification();

  const handleActionConfirmed = useCallback(() => {
    setConfirmed(true);
  }, []);

  const handleValidated = useCallback(
    (actionId: string, narrativeNote: string | null) => {
      onActionValidated(actionId, narrativeNote);
      setWaitingForGm(false);
      setConfirmed(false);
    },
    [onActionValidated]
  );

  const handleRejected = useCallback(
    (actionId: string, feedback: string) => {
      onActionRejected(actionId, feedback);
      setWaitingForGm(false);
      setConfirmed(false);
    },
    [onActionRejected]
  );

  const handleCancelledConfirmation = useCallback(() => {
    setWaitingForGm(false);
    setConfirmed(false);
    setPendingActionId(null);
  }, []);

  // Real-time updates via WebSocket
  useActionPipelineWebSocket(campaignId, sessionId, {
    onActionConfirmed: handleActionConfirmed,
    onActionValidated: handleValidated,
    onActionRejected: handleRejected,
    onActionCancelledConfirmation: handleCancelledConfirmation,
  });

  const handleSubmit = (
    actionType: ActionType,
    description: string,
    target?: string
  ) => {
    const actionId = crypto.randomUUID();
    clearOutcome();
    setPendingActionId(actionId);
    proposeAction.mutate(
      {
        campaignId,
        sessionId,
        actionId,
        actionType,
        description,
        target,
      },
      {
        onSuccess: () => setWaitingForGm(true),
      }
    );
  };

  const handleCancel = () => {
    if (!pendingActionId) return;
    cancelAction.mutate(
      {
        campaignId,
        sessionId,
        actionId: pendingActionId,
      },
      {
        onSuccess: () => {
          setWaitingForGm(false);
          setConfirmed(false);
          setPendingActionId(null);
        },
      }
    );
  };

  const handleDismissOutcome = () => {
    clearOutcome();
  };

  return (
    <div className="space-y-3">
      {outcome && (
        <ActionOutcomeNotification
          outcome={outcome}
          onDismiss={handleDismissOutcome}
        />
      )}

      {waitingForGm ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-secondary px-4 py-6">
          {confirmed ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-text-secondary">
                Action submitted successfully
              </span>
            </>
          ) : (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
              <span className="text-sm text-text-secondary">
                Waiting for GM…
              </span>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={cancelAction.isPending}
            aria-label="Cancel pending action"
            className="ml-4"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-3 text-sm font-medium text-text-secondary">
            Your Action
          </h3>
          {pipelineMode === "mandatory" && !isPinged ? (
            <div
              className="flex items-center justify-center rounded-lg px-4 py-6 opacity-50 cursor-not-allowed transition-opacity duration-300 motion-reduce:transition-none"
              aria-disabled="true"
            >
              <p className="text-sm text-text-muted italic" aria-live="polite">
                Waiting for The Master to signal your turn
              </p>
            </div>
          ) : (
            <div
              className={
                pipelineMode === "mandatory" && isPinged
                  ? "transition-opacity duration-300 motion-reduce:transition-none"
                  : undefined
              }
            >
              {pipelineMode === "mandatory" && isPinged && (
                <p className="mb-2 text-sm font-medium text-emerald-500">
                  The Master awaits your action
                </p>
              )}
              <ActionToolbar
                onSubmit={handleSubmit}
                disabled={proposeAction.isPending}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
