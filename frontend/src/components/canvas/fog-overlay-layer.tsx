"use client";

import { Layer, Rect, Group } from "react-konva";
import type { FogZone } from "@/types/api";

interface FogOverlayLayerProps {
  fogZones?: FogZone[];
  stageWidth: number;
  stageHeight: number;
}

export function FogOverlayLayer({
  fogZones,
  stageWidth,
  stageHeight,
}: FogOverlayLayerProps) {
  if (!fogZones || fogZones.length === 0) {
    return null;
  }

  const revealedZones = fogZones.filter((zone) => zone.revealed);

  return (
    <Layer listening={false}>
      <Group>
        {/* Full dark overlay */}
        <Rect
          x={0}
          y={0}
          width={stageWidth}
          height={stageHeight}
          fill="#000"
          opacity={0.85}
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
