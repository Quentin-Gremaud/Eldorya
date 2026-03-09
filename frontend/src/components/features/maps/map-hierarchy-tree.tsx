"use client";

import { MapLevelTreeItem } from "./map-level-tree-item";
import type { MapLevel } from "@/types/api";

interface MapHierarchyTreeProps {
  levels: MapLevel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

export function MapHierarchyTree({
  levels,
  selectedId,
  onSelect,
  onRename,
}: MapHierarchyTreeProps) {
  const rootLevels = levels.filter((l) => l.parentId === null);

  if (levels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <p className="text-sm">No map levels yet.</p>
        <p className="text-xs mt-1">Create your first map level to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5" role="tree" aria-label="Map hierarchy">
      {rootLevels.map((root) => (
        <MapLevelTreeItem
          key={root.id}
          level={root}
          children={levels.filter((l) => l.parentId === root.id)}
          allLevels={levels}
          selectedId={selectedId}
          onSelect={onSelect}
          onRename={onRename}
        />
      ))}
    </div>
  );
}
