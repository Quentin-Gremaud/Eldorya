"use client";

import { useState, useCallback } from "react";
import type { ActionOutcome } from "@/types/api";

export function useActionOutcomeNotification() {
  const [outcome, setOutcome] = useState<ActionOutcome | null>(null);

  const onActionValidated = useCallback(
    (actionId: string, narrativeNote: string | null) => {
      setOutcome({
        actionId,
        status: "validated",
        narrativeNote,
        resolvedAt: new Date().toISOString(),
      });
    },
    []
  );

  const onActionRejected = useCallback(
    (actionId: string, feedback: string) => {
      setOutcome({
        actionId,
        status: "rejected",
        feedback,
        resolvedAt: new Date().toISOString(),
      });
    },
    []
  );

  const clearOutcome = useCallback(() => {
    setOutcome(null);
  }, []);

  return {
    outcome,
    onActionValidated,
    onActionRejected,
    clearOutcome,
  };
}
