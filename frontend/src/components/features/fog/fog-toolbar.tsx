"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Crosshair, Users } from "lucide-react";

export type FogTool = "select" | "fog-reveal" | "fog-reveal-all";

interface FogToolbarProps {
  activeTool: FogTool;
  onToolChange: (tool: FogTool) => void;
}

export function FogToolbar({ activeTool, onToolChange }: FogToolbarProps) {
  const isFogRevealActive = activeTool === "fog-reveal";
  const isFogRevealAllActive = activeTool === "fog-reveal-all";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === "f") {
        e.preventDefault();
        onToolChange(isFogRevealActive ? "select" : "fog-reveal");
      } else if (e.key === "g") {
        e.preventDefault();
        onToolChange(isFogRevealAllActive ? "select" : "fog-reveal-all");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFogRevealActive, isFogRevealAllActive, onToolChange]);

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isFogRevealActive ? "default" : "outline"}
            size="sm"
            onClick={() =>
              onToolChange(isFogRevealActive ? "select" : "fog-reveal")
            }
            aria-label="Toggle fog reveal tool"
            aria-pressed={isFogRevealActive}
            data-testid="fog-reveal-button"
          >
            <Crosshair className="h-4 w-4 mr-1" />
            Fog Reveal
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Reveal fog zone for a specific player (F)
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isFogRevealAllActive ? "default" : "outline"}
            size="sm"
            onClick={() =>
              onToolChange(isFogRevealAllActive ? "select" : "fog-reveal-all")
            }
            aria-label="Toggle fog reveal all tool"
            aria-pressed={isFogRevealAllActive}
            data-testid="fog-reveal-all-button"
          >
            <Users className="h-4 w-4 mr-1" />
            Reveal to All
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Reveal fog zone to all players (G)
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
