import type { MapLevel } from "@/types/api";

export function buildMapLevelPath(levels: MapLevel[], targetId: string): MapLevel[] {
  const path: MapLevel[] = [];
  let current = levels.find((l) => l.id === targetId);

  while (current) {
    path.unshift(current);
    current = current.parentId
      ? levels.find((l) => l.id === current!.parentId)
      : undefined;
  }

  return path;
}

export function formatMapLevelPath(levels: MapLevel[], targetId: string): string {
  const path = buildMapLevelPath(levels, targetId);
  return path.map((l) => l.name).join(" > ");
}
