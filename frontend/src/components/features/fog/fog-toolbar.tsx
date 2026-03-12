"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Crosshair, Users, EyeOff, ShieldOff } from "lucide-react";

export type FogTool =
  | "select"
  | "fog-reveal"
  | "fog-reveal-all"
  | "fog-hide"
  | "fog-hide-all";

interface FogToolbarProps {
  activeTool: FogTool;
  onToolChange: (tool: FogTool) => void;
}

export function FogToolbar({ activeTool, onToolChange }: FogToolbarProps) {
  const isFogRevealActive = activeTool === "fog-reveal";
  const isFogRevealAllActive = activeTool === "fog-reveal-all";
  const isFogHideActive = activeTool === "fog-hide";
  const isFogHideAllActive = activeTool === "fog-hide-all";

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
      } else if (e.key === "h") {
        e.preventDefault();
        onToolChange(isFogHideActive ? "select" : "fog-hide");
      } else if (e.key === "j") {
        e.preventDefault();
        onToolChange(isFogHideAllActive ? "select" : "fog-hide-all");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFogRevealActive, isFogRevealAllActive, isFogHideActive, isFogHideAllActive, onToolChange]);

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

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isFogHideActive ? "default" : "outline"}
            size="sm"
            onClick={() =>
              onToolChange(isFogHideActive ? "select" : "fog-hide")
            }
            aria-label="Toggle fog hide tool"
            aria-pressed={isFogHideActive}
            data-testid="fog-hide-button"
          >
            <EyeOff className="h-4 w-4 mr-1" />
            Fog Hide
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Hide fog zone for a specific player (H)
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isFogHideAllActive ? "default" : "outline"}
            size="sm"
            onClick={() =>
              onToolChange(isFogHideAllActive ? "select" : "fog-hide-all")
            }
            aria-label="Toggle fog hide all tool"
            aria-pressed={isFogHideAllActive}
            data-testid="fog-hide-all-button"
          >
            <ShieldOff className="h-4 w-4 mr-1" />
            Hide from All
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Hide fog zone from all players (J)
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
