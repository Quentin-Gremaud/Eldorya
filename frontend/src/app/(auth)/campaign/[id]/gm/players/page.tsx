"use client";

import { use, useState } from "react";
import { useActiveSession } from "@/hooks/use-active-session";
import { useCockpitState } from "@/hooks/use-cockpit-state";
import { usePresence } from "@/hooks/use-presence";
import { useCampaignPlayers } from "@/hooks/use-campaign-players";
import { useCampaignCharacters } from "@/hooks/use-campaign-characters";
import { PresenceIndicator } from "@/components/shared/presence-indicator";
import { StatBlockGrid } from "@/components/features/characters/stat-block";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, User } from "lucide-react";
import type { CharacterSummary } from "@/types/api";

export default function GmPlayersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = use(params);
  const { session } = useActiveSession(campaignId);
  const { cockpitState, isLoading } = useCockpitState(
    campaignId,
    session?.id ?? ""
  );
  const { getPresence } = usePresence(session?.id ?? "");
  const { players } = useCampaignPlayers(campaignId);
  const { characters } = useCampaignCharacters(campaignId);

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <main className="flex-1 p-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const playerMap = new Map(players.map((p) => [p.userId, p]));
  const characterMap = new Map(
    (characters ?? []).map((c: CharacterSummary) => [c.userId, c])
  );

  const cockpitPlayers = cockpitState?.players ?? [];

  return (
    <main className="flex-1 p-4">
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-text-primary">Players</h1>

        {cockpitPlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border p-12 text-center">
            <User className="h-12 w-12 text-text-secondary mb-3" />
            <p className="text-text-secondary">No players in this campaign yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {cockpitPlayers.map((cp) => {
              const player = playerMap.get(cp.userId);
              const character = characterMap.get(cp.userId);
              const status = getPresence(cp.userId);
              const isExpanded = expandedUserId === cp.userId;

              return (
                <Card
                  key={cp.userId}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() =>
                    setExpandedUserId(isExpanded ? null : cp.userId)
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PresenceIndicator
                          displayName={player?.displayName ?? cp.userId}
                          status={status}
                        />
                        <div>
                          <CardTitle className="text-base">
                            {player?.displayName ?? cp.userId}
                          </CardTitle>
                          {cp.characterName && (
                            <p className="text-sm text-text-secondary">
                              {cp.characterName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {cp.characterStatus && (
                          <Badge
                            variant={
                              cp.characterStatus === "approved"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {cp.characterStatus}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            status === "online"
                              ? "border-emerald-500 text-emerald-500"
                              : status === "idle"
                                ? "border-muted text-muted-foreground"
                                : "border-muted text-muted-foreground opacity-50"
                          }
                        >
                          {status}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-text-secondary" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-text-secondary" />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && character && (
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-text-secondary">
                        <span>{character.race}</span>
                        <span>&middot;</span>
                        <span>{character.characterClass}</span>
                        <span>&middot;</span>
                        <span>{character.background}</span>
                      </div>
                      <StatBlockGrid stats={character.stats} />
                      {character.spells.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-text-secondary mb-1">
                            Spells
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {character.spells.map((spell) => (
                              <Badge key={spell} variant="outline">
                                {spell}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}

                  {isExpanded && !character && (
                    <CardContent>
                      <p className="text-sm text-text-secondary italic">
                        No character created yet.
                      </p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
