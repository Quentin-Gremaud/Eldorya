"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MapLevel } from "@/types/api";

interface MapBreadcrumbProps {
  levels: MapLevel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function buildPath(levels: MapLevel[], selectedId: string): MapLevel[] {
  const path: MapLevel[] = [];
  let current = levels.find((l) => l.id === selectedId);

  while (current) {
    path.unshift(current);
    current = current.parentId
      ? levels.find((l) => l.id === current!.parentId)
      : undefined;
  }

  return path;
}

export function MapBreadcrumb({
  levels,
  selectedId,
  onSelect,
}: MapBreadcrumbProps) {
  if (!selectedId) {
    return null;
  }

  const path = buildPath(levels, selectedId);

  if (path.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="Map breadcrumb">
      {path.map((level, index) => (
        <span key={level.id} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          <button
            type="button"
            className={cn(
              "hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
              index === path.length - 1
                ? "font-semibold text-foreground"
                : "text-muted-foreground"
            )}
            onClick={() => onSelect(level.id)}
          >
            {level.name}
          </button>
        </span>
      ))}
    </nav>
  );
}
