"use client";

import { useState } from "react";
import { usePendingActions } from "@/hooks/use-pending-actions";
import { useActionPipelineWebSocket } from "@/hooks/use-action-pipeline-web-socket";
import { ActionCard } from "./action-card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Inbox } from "lucide-react";

interface PendingActionQueueProps {
  campaignId: string;
  sessionId: string;
}

export function PendingActionQueue({
  campaignId,
  sessionId,
}: PendingActionQueueProps) {
  const { actions } = usePendingActions(campaignId, sessionId);
  const [collapsed, setCollapsed] = useState(false);

  // Real-time updates via WebSocket
  useActionPipelineWebSocket(campaignId, sessionId);

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
          {actions.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Inbox className="h-8 w-8 text-text-muted mb-2" />
              <p className="text-sm text-text-muted">No pending actions</p>
            </div>
          ) : (
            actions.map((action) => (
              <ActionCard key={action.id} action={action} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
