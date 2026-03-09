"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Scroll } from "lucide-react";
import type { PendingCharacterDetail } from "@/types/api";
import { StatBlockGrid } from "./stat-block";

interface PendingCharacterCardProps {
  character: PendingCharacterDetail;
  onApprove: (characterId: string) => void;
  onReject: (characterId: string, reason: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

export function PendingCharacterCard({
  character,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: PendingCharacterCardProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const isBusy = isApproving || isRejecting;

  const handleReject = () => {
    if (rejectReason.trim().length === 0) return;
    onReject(character.id, rejectReason.trim());
  };

  return (
    <Card className="bg-surface-elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{character.name}</CardTitle>
          <Badge className="border-amber-500/30 bg-amber-500/20 text-amber-400">
            Pending Review
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{character.race}</span>
          <span>&middot;</span>
          <span>{character.characterClass}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Background
          </h3>
          <p className="text-sm text-foreground">{character.background}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Statistics
          </h3>
          <StatBlockGrid stats={character.stats} />
        </div>

        {character.spells.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Scroll className="size-4" />
              Spells
            </h3>
            <div className="flex flex-wrap gap-2">
              {character.spells.map((spell) => (
                <Badge key={spell} variant="secondary">
                  {spell}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {showRejectForm && (
          <div className="space-y-2">
            <Textarea
              placeholder="Explain why this character is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={500}
              aria-label="Rejection reason"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {rejectReason.length}/500 characters
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => onApprove(character.id)}
            disabled={isBusy}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            aria-label={`Approve ${character.name}`}
          >
            {isApproving ? "Approving..." : "Approve"}
          </Button>

          {!showRejectForm ? (
            <Button
              variant="destructive"
              onClick={() => setShowRejectForm(true)}
              disabled={isBusy}
              aria-label={`Reject ${character.name}`}
            >
              Reject
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isBusy || rejectReason.trim().length === 0}
                aria-label={`Confirm rejection of ${character.name}`}
              >
                {isRejecting ? "Rejecting..." : "Confirm Rejection"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason("");
                }}
                disabled={isBusy}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
