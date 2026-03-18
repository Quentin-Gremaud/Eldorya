"use client";

import { useCallback, useState } from "react";
import { useProposeAction } from "@/hooks/use-propose-action";
import { useActionPipelineWebSocket } from "@/hooks/use-action-pipeline-web-socket";
import { ActionToolbar } from "./action-toolbar";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { ActionType } from "@/types/api";

interface ActionSubmissionPanelProps {
  campaignId: string;
  sessionId: string;
}

export function ActionSubmissionPanel({
  campaignId,
  sessionId,
}: ActionSubmissionPanelProps) {
  const proposeAction = useProposeAction();
  const [waitingForGm, setWaitingForGm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleActionConfirmed = useCallback(() => {
    setConfirmed(true);
  }, []);

  // Real-time updates via WebSocket
  useActionPipelineWebSocket(campaignId, sessionId, {
    onActionConfirmed: handleActionConfirmed,
  });

  const handleSubmit = (
    actionType: ActionType,
    description: string,
    target?: string
  ) => {
    const actionId = crypto.randomUUID();
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

  if (waitingForGm) {
    return (
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
        <button
          onClick={() => {
            setWaitingForGm(false);
            setConfirmed(false);
          }}
          className="ml-4 text-xs text-primary hover:underline"
        >
          Submit another action
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-medium text-text-secondary">
        Your Action
      </h3>
      <ActionToolbar
        onSubmit={handleSubmit}
        disabled={proposeAction.isPending}
      />
    </div>
  );
}
