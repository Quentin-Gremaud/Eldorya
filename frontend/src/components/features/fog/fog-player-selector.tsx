"use client";

import type { PlayerOnboardingItem } from "@/types/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FogPlayerSelectorProps {
  players: PlayerOnboardingItem[];
  selectedPlayerId: string | null;
  onPlayerChange: (playerId: string) => void;
  visible: boolean;
}

export function FogPlayerSelector({
  players,
  selectedPlayerId,
  onPlayerChange,
  visible,
}: FogPlayerSelectorProps) {
  if (!visible || players.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2" data-testid="fog-player-selector">
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        Reveal for:
      </span>
      <Select
        value={selectedPlayerId ?? undefined}
        onValueChange={onPlayerChange}
      >
        <SelectTrigger className="h-8 w-[180px] text-xs">
          <SelectValue placeholder="Select player" />
        </SelectTrigger>
        <SelectContent>
          {players.map((player) => (
            <SelectItem key={player.userId} value={player.userId}>
              {player.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
