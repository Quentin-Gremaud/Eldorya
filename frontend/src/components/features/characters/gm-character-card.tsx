"use client";

import { useState } from "react";
import { Pencil, Scroll } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatBlockGrid } from "./stat-block";
import { GMCharacterModificationDialog } from "./gm-character-modification-dialog";
import type { CharacterSummary } from "@/types/api";

interface GMCharacterCardProps {
  campaignId: string;
  character: CharacterSummary;
}

export function GMCharacterCard({ campaignId, character }: GMCharacterCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Card className="bg-surface-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{character.name}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
            >
              <Pencil className="size-4 mr-1" />
              Modify
            </Button>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{character.race}</span>
            <span>&middot;</span>
            <span>{character.characterClass}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatBlockGrid stats={character.stats} />

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
        </CardContent>
      </Card>

      <GMCharacterModificationDialog
        campaignId={campaignId}
        character={character}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
