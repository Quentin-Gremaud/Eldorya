"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Crosshair } from "lucide-react";

export type FogTool = "select" | "fog-reveal";

interface FogToolbarProps {
  activeTool: FogTool;
  onToolChange: (tool: FogTool) => void;
}

export function FogToolbar({ activeTool, onToolChange }: FogToolbarProps) {
  const isFogActive = activeTool === "fog-reveal";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "f" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault();
        onToolChange(isFogActive ? "select" : "fog-reveal");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFogActive, onToolChange]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isFogActive ? "default" : "outline"}
          size="sm"
          onClick={() => onToolChange(isFogActive ? "select" : "fog-reveal")}
          aria-label="Toggle fog reveal tool"
          aria-pressed={isFogActive}
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
  );
}
