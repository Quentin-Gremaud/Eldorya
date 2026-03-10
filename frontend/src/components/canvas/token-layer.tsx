"use client";

import { Layer, Group, Circle, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Token, FogZone } from "@/types/api";
import { TOKEN_COLORS, TOKEN_FALLBACK_COLOR } from "./token-colors";

const TOKEN_SIZE = 40;

export type ViewMode = "gm" | "player" | "preview";

function isTokenInRevealedZone(
  tokenX: number,
  tokenY: number,
  fogZones: FogZone[]
): boolean {
  return fogZones.some(
    (zone) =>
      zone.revealed &&
      tokenX >= zone.x &&
      tokenX <= zone.x + zone.width &&
      tokenY >= zone.y &&
      tokenY <= zone.y + zone.height
  );
}

interface TokenLayerProps {
  tokens: Token[];
  interactive: boolean;
  viewMode?: ViewMode;
  fogZones?: FogZone[];
  onTokenMove?: (tokenId: string, x: number, y: number) => void;
  onContextMenu?: (tokenId: string, x: number, y: number) => void;
}

export function TokenLayer({
  tokens,
  interactive,
  viewMode = "gm",
  fogZones,
  onTokenMove,
  onContextMenu,
}: TokenLayerProps) {
  const visibleTokens =
    viewMode !== "gm" && fogZones && fogZones.length > 0
      ? tokens.filter((token) =>
          isTokenInRevealedZone(token.x, token.y, fogZones)
        )
      : tokens;
  const handleDragEnd = (tokenId: string, e: KonvaEventObject<DragEvent>) => {
    if (!onTokenMove) return;
    const x = Math.round(e.target.x());
    const y = Math.round(e.target.y());
    onTokenMove(tokenId, x, y);
  };

  const handleContextMenu = (
    tokenId: string,
    e: KonvaEventObject<PointerEvent>
  ) => {
    e.evt.preventDefault();
    if (!onContextMenu) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const container = stage.container().getBoundingClientRect();
    onContextMenu(tokenId, e.evt.clientX - container.left, e.evt.clientY - container.top);
  };

  return (
    <Layer>
      {visibleTokens.map((token) => {
        const colorDef = TOKEN_COLORS[token.tokenType];
        const color = colorDef?.hex ?? TOKEN_FALLBACK_COLOR;
        return (
          <Group
            key={token.id}
            x={token.x}
            y={token.y}
            draggable={interactive}
            onDragEnd={(e) => handleDragEnd(token.id, e)}
            onContextMenu={interactive ? (e) => handleContextMenu(token.id, e) : undefined}
          >
            <Circle
              radius={TOKEN_SIZE / 2}
              fill={color}
              stroke="#1F2937"
              strokeWidth={2}
            />
            <Text
              text={token.label}
              fontSize={11}
              fill="#1F2937"
              align="center"
              y={TOKEN_SIZE / 2 + 2}
              width={80}
              offsetX={40}
            />
          </Group>
        );
      })}
    </Layer>
  );
}
