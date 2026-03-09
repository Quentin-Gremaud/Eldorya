"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, X, ArrowRight } from "lucide-react";
import type { PendingModification } from "@/hooks/use-pending-modifications";
import type { ProposedChange } from "@/types/api";

interface CharacterModificationReviewCardProps {
  modification: PendingModification;
  onApprove: (characterId: string) => void;
  onReject: (characterId: string, reason: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

function ChangeRow({
  field,
  change,
}: {
  field: string;
  change: ProposedChange;
}) {
  const formatValue = (value: unknown): string => {
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) return value.join(", ") || "(none)";
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-surface-base p-2 text-sm">
      <span className="font-medium capitalize text-muted-foreground min-w-20">
        {field}
      </span>
      <span className="text-red-400 line-through">
        {formatValue(change.current)}
      </span>
      <ArrowRight className="size-3 text-muted-foreground shrink-0" />
      <span className="text-emerald-400">{formatValue(change.proposed)}</span>
    </div>
  );
}

export function CharacterModificationReviewCard({
  modification,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: CharacterModificationReviewCardProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject(modification.id, rejectionReason.trim());
    }
  };

  return (
    <Card className="bg-surface-elevated border-violet-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{modification.name}</CardTitle>
          <Badge className="border-violet-500/30 bg-violet-500/20 text-violet-400">
            Modification Request
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{modification.race}</span>
          <span>&middot;</span>
          <span>{modification.characterClass}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Proposed Changes */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Proposed Changes
          </h4>
          <div className="space-y-2">
            {Object.entries(modification.proposedChanges).map(
              ([field, change]) => (
                <ChangeRow key={field} field={field} change={change} />
              )
            )}
          </div>
        </div>

        {/* Actions */}
        {!showRejectForm ? (
          <div className="flex gap-3">
            <Button
              onClick={() => onApprove(modification.id)}
              disabled={isApproving || isRejecting}
              className="flex-1"
            >
              {isApproving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Check className="mr-2 size-4" />
              )}
              Approve Changes
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowRejectForm(true)}
              disabled={isApproving || isRejecting}
              className="flex-1"
            >
              <X className="mr-2 size-4" />
              Reject
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              placeholder="Explain why these changes are rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={
                  !rejectionReason.trim() || isRejecting || isApproving
                }
                className="flex-1"
              >
                {isRejecting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  "Confirm Rejection"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionReason("");
                }}
                disabled={isRejecting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
