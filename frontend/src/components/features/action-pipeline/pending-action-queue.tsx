"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { usePendingActions } from "@/hooks/use-pending-actions";
import { useActionPipelineWebSocket } from "@/hooks/use-action-pipeline-web-socket";
import { useValidateAction } from "@/hooks/use-validate-action";
import { useRejectAction } from "@/hooks/use-reject-action";
import { useReorderActionQueue } from "@/hooks/use-reorder-action-queue";
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
  const [announcement, setAnnouncement] = useState("");
  const knownActionIdsRef = useRef<Set<string>>(new Set());

  const validateAction = useValidateAction();
  const rejectAction = useRejectAction();
  const reorderActionQueue = useReorderActionQueue();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // Track known action IDs so entrance animation only applies to new ones
  const newActionIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    const currentIds = new Set(actions.map((a) => a.id));
    if (knownActionIdsRef.current.size > 0) {
      for (const id of currentIds) {
        if (!knownActionIdsRef.current.has(id)) {
          newActionIds.current.add(id);
        }
      }
    }
    knownActionIdsRef.current = currentIds;
  }, [actions]);

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

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = actions.findIndex((a) => a.id === active.id);
      const newIndex = actions.findIndex((a) => a.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(actions, oldIndex, newIndex);
      const movedAction = actions[oldIndex];
      setAnnouncement(
        `${movedAction.description} moved to position ${newIndex + 1}`,
      );
      reorderActionQueue.mutate({
        campaignId,
        sessionId,
        orderedActionIds: reordered.map((a) => a.id),
      });
    },
    [actions, campaignId, sessionId, reorderActionQueue.mutate],
  );

  // Merge: preserve order — replace cache entries with flashing snapshots in-place, append any orphaned flashing actions at end
  const visibleActions = actions.map((a) =>
    flashingActions.has(a.id) ? flashingActions.get(a.id)! : a,
  );

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
        <DndContext
          sensors={isGm ? sensors : undefined}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleActions.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="max-h-96 overflow-y-auto p-3 space-y-2" role="list">
              {visibleActions.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <Inbox className="h-8 w-8 text-text-muted mb-2" />
                  <p className="text-sm text-text-muted">No pending actions</p>
                </div>
              ) : (
                visibleActions.map((action) => (
                  <div
                    key={action.id}
                    role="listitem"
                    className={
                      newActionIds.current.has(action.id)
                        ? "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-300"
                        : undefined
                    }
                    onAnimationEnd={() => newActionIds.current.delete(action.id)}
                  >
                    <ActionCard
                      action={action}
                      isGm={isGm}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onRemove={handleRemove}
                    />
                  </div>
                ))
              )}
            </div>
            <div aria-live="polite" className="sr-only">
              {announcement}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
