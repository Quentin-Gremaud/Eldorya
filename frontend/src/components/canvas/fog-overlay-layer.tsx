"use client";

import { Layer, Rect, Group } from "react-konva";
import type { FogZone } from "@/types/api";

type ViewMode = "gm" | "preview" | "player";

interface FogOverlayLayerProps {
  fogZones?: FogZone[];
  stageWidth: number;
  stageHeight: number;
  viewMode?: ViewMode;
}

export function FogOverlayLayer({
  fogZones,
  stageWidth,
  stageHeight,
  viewMode = "player",
}: FogOverlayLayerProps) {
  if (!fogZones || fogZones.length === 0) {
    return null;
  }

  const revealedZones = fogZones.filter((zone) => zone.revealed);
  const overlayOpacity = viewMode === "gm" ? 0.4 : 0.85;

  return (
    <Layer listening={false}>
      <Group>
        {/* Full dark overlay — lighter in GM mode for better visibility */}
        <Rect
          x={0}
          y={0}
          width={stageWidth}
          height={stageHeight}
          fill="#000"
          opacity={overlayOpacity}
        />
        {/* Punch transparent holes for revealed zones */}
        {revealedZones.map((zone) => (
          <Rect
            key={zone.id}
            x={zone.x}
            y={zone.y}
            width={zone.width}
            height={zone.height}
            fill="#000"
            globalCompositeOperation="destination-out"
          />
        ))}
      </Group>
    </Layer>
  );
}
