"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scroll, Pencil } from "lucide-react";
import type { CharacterDetail } from "@/types/api";
import { StatBlockGrid } from "./stat-block";
import { CharacterModificationDialog } from "./character-modification-dialog";

interface CharacterSheetProps {
  character: CharacterDetail;
  campaignId: string;
}

const STATUS_BADGE_CONFIG: Record<
  CharacterDetail["status"],
  { label: string; className: string }
> = {
  pending: {
    label: "Pending GM Validation",
    className: "border-amber-500/30 bg-amber-500/20 text-amber-400",
  },
  approved: {
    label: "Approved",
    className: "border-emerald-500/30 bg-emerald-500/20 text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    className: "border-red-500/30 bg-red-500/20 text-red-400",
  },
  pending_revalidation: {
    label: "Pending Re-validation",
    className: "border-violet-500/30 bg-violet-500/20 text-violet-400",
  },
};

export function CharacterSheet({ character, campaignId }: CharacterSheetProps) {
  const [modDialogOpen, setModDialogOpen] = useState(false);
  const statusConfig = STATUS_BADGE_CONFIG[character.status];

  return (
    <>
      <Card className="bg-surface-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{character.name}</CardTitle>
            <Badge className={statusConfig.className}>
              {statusConfig.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{character.race}</span>
            <span>&middot;</span>
            <span>{character.characterClass}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Background */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Background
            </h3>
            <p className="text-sm text-foreground">{character.background}</p>
          </div>

          {/* Stats */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Statistics
            </h3>
            <StatBlockGrid stats={character.stats} />
          </div>

          {/* Spells */}
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

          {/* Request Modification button — only for approved characters */}
          {character.status === "approved" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setModDialogOpen(true)}
            >
              <Pencil className="mr-2 size-4" />
              Request Modification
            </Button>
          )}

          {/* Pending re-validation notice */}
          {character.status === "pending_revalidation" && (
            <div className="rounded-md border border-violet-500/30 bg-violet-500/10 p-3 text-sm text-violet-300">
              Your modification request is pending GM review. You cannot make
              further changes until the GM approves or rejects the request.
            </div>
          )}
        </CardContent>
      </Card>

      <CharacterModificationDialog
        open={modDialogOpen}
        onOpenChange={setModDialogOpen}
        character={character}
        campaignId={campaignId}
      />
    </>
  );
}
