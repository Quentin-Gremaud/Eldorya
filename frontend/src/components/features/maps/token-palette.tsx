"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Users, Shield, Skull, MapPin } from "lucide-react";
import { TOKEN_COLORS } from "@/components/canvas/token-colors";
import type { TokenType } from "@/types/api";

const TOKEN_TEMPLATES: readonly { type: TokenType; label: string; icon: typeof Users }[] = [
  { type: "player", label: "Player", icon: Users },
  { type: "npc", label: "NPC", icon: Shield },
  { type: "monster", label: "Monster", icon: Skull },
  { type: "location", label: "Location", icon: MapPin },
];

export function TokenPalette() {
  const [labels, setLabels] = useState<Record<string, string>>({
    player: "Player",
    npc: "NPC",
    monster: "Monster",
    location: "Location",
  });

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    tokenType: string
  ) => {
    e.dataTransfer.setData("tokenType", tokenType);
    e.dataTransfer.setData("label", labels[tokenType] || tokenType);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Tokens</h3>
      {TOKEN_TEMPLATES.map((template) => {
        const Icon = template.icon;
        return (
          <div
            key={template.type}
            className="flex items-center gap-2 p-2 rounded-md border cursor-grab active:cursor-grabbing hover:bg-accent/50 transition-colors"
            draggable
            onDragStart={(e) => handleDragStart(e, template.type)}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                TOKEN_COLORS[template.type].tailwind
              )}
            >
              <Icon className="h-4 w-4 text-gray-900" />
            </div>
            <Input
              value={labels[template.type]}
              onChange={(e) =>
                setLabels((prev) => ({
                  ...prev,
                  [template.type]: e.target.value,
                }))
              }
              className="h-7 text-xs"
              placeholder={template.label}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        Drag a token onto the map to place it.
      </p>
    </div>
  );
}
