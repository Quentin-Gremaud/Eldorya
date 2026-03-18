"use client";

import { usePingPlayer } from "@/hooks/use-ping-player";
import { usePingStatus } from "@/hooks/use-ping-status";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

interface PlayerInfo {
  userId: string;
  displayName: string;
}

interface PlayerPingPanelProps {
  campaignId: string;
  sessionId: string;
  players: PlayerInfo[];
}

export function PlayerPingPanel({
  campaignId,
  sessionId,
  players,
}: PlayerPingPanelProps) {
  const pingPlayer = usePingPlayer();
  const { pingStatus } = usePingStatus(campaignId, sessionId);

  const handlePing = (playerId: string) => {
    pingPlayer.mutate({ campaignId, sessionId, playerId });
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-text-secondary">Players</h3>
      {players.length === 0 ? (
        <p className="text-xs text-text-muted">No players connected</p>
      ) : (
        <div className="space-y-1">
          {players.map((player) => {
            const isPinged = pingStatus?.playerId === player.userId;
            return (
              <div
                key={player.userId}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                  isPinged
                    ? "bg-amber-500/10 ring-1 ring-amber-500/30"
                    : "bg-surface-secondary"
                }`}
              >
                <span className="text-text-primary">{player.displayName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePing(player.userId)}
                  disabled={pingPlayer.isPending}
                  aria-label={`Ping ${player.displayName}`}
                >
                  <Bell
                    className={`h-4 w-4 ${
                      isPinged ? "text-amber-500" : "text-text-muted"
                    }`}
                  />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
