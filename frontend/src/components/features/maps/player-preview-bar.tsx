"use client";

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PlayerOnboardingItem } from "@/types/api";

interface PlayerPreviewBarProps {
  playerId: string;
  players: PlayerOnboardingItem[];
  onPlayerChange: (playerId: string) => void;
  onExit: () => void;
}

export function PlayerPreviewBar({
  playerId,
  players,
  onPlayerChange,
  onExit,
}: PlayerPreviewBarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-amber-500/90 text-black font-medium backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span>Previewing as:</span>
        <Select
          value={playerId}
          onValueChange={onPlayerChange}
        >
          <SelectTrigger className="w-[160px] h-8 bg-white/80 border-amber-600">
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
      <Button
        variant="outline"
        size="sm"
        onClick={onExit}
        className="bg-white/80 border-amber-600 hover:bg-white"
      >
        Exit Preview
      </Button>
    </div>
  );
}
