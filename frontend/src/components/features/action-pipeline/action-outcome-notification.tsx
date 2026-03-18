"use client";

import { Button } from "@/components/ui/button";
import type { ActionOutcome } from "@/types/api";
import { Check, X } from "lucide-react";

interface ActionOutcomeNotificationProps {
  outcome: ActionOutcome;
  onDismiss: () => void;
}

export function ActionOutcomeNotification({
  outcome,
  onDismiss,
}: ActionOutcomeNotificationProps) {
  const isValidated = outcome.status === "validated";

  return (
    <div
      className={`rounded-lg border-2 p-4 ${
        isValidated
          ? "border-emerald-500 bg-emerald-500/5"
          : "border-red-500 bg-red-500/5"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div
          className={`rounded-full p-1 ${
            isValidated ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
          }`}
        >
          {isValidated ? (
            <Check className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">
            {isValidated ? "Action Approved" : "Action Rejected"}
          </p>
          {isValidated && outcome.narrativeNote && (
            <p className="mt-1 text-sm italic text-text-secondary">
              &ldquo;{outcome.narrativeNote}&rdquo;
            </p>
          )}
          {!isValidated && outcome.feedback && (
            <p className="mt-1 text-sm text-text-secondary">
              {outcome.feedback}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
