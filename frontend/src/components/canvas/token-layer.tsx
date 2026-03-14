"use client";

import { useState } from "react";
import { Layer, Group, Circle, Rect, Text, Label, Tag } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Token, FogZone, MapLevel } from "@/types/api";
import { TOKEN_COLORS, TOKEN_FALLBACK_COLOR } from "./token-colors";
import { formatMapLevelPath } from "@/lib/utils/map-path";

const TOKEN_SIZE = 40;
const LOCATION_SIZE = 36;

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
  mapLevels?: MapLevel[];
  onTokenMove?: (tokenId: string, x: number, y: number) => void;
  onContextMenu?: (tokenId: string, x: number, y: number) => void;
  onLocationNavigate?: (destinationMapLevelId: string) => void;
  onBrokenLinkClick?: (tokenId: string) => void;
}

export function TokenLayer({
  tokens,
  interactive,
  viewMode = "gm",
  fogZones,
  mapLevels,
  onTokenMove,
  onContextMenu,
  onLocationNavigate,
  onBrokenLinkClick,
}: TokenLayerProps) {
  const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null);

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

  const isLocationBrokenLink = (token: Token): boolean => {
    if (token.tokenType !== "location" || !token.destinationMapLevelId) return false;
    return !!mapLevels && !mapLevels.some((l) => l.id === token.destinationMapLevelId);
  };

  const getDestinationLabel = (token: Token): string => {
    if (!token.destinationMapLevelId || !mapLevels) return "";
    const dest = mapLevels.find((l) => l.id === token.destinationMapLevelId);
    return dest ? dest.name : "";
  };

  const getTooltipText = (token: Token): string => {
    if (!token.destinationMapLevelId || !mapLevels) return "";
    if (isLocationBrokenLink(token)) return "Linked map level no longer exists";
    return formatMapLevelPath(mapLevels, token.destinationMapLevelId);
  };

  const handleLocationClick = (token: Token) => {
    if (token.tokenType !== "location" || !token.destinationMapLevelId) return;

    if (isLocationBrokenLink(token)) {
      onBrokenLinkClick?.(token.id);
      return;
    }

    onLocationNavigate?.(token.destinationMapLevelId);
  };

  return (
    <Layer>
      {visibleTokens.map((token) => {
        const isLocation = token.tokenType === "location";
        const isBroken = isLocation && isLocationBrokenLink(token);
        const colorDef = TOKEN_COLORS[token.tokenType];
        const color = colorDef?.hex ?? TOKEN_FALLBACK_COLOR;
        const isHovered = hoveredTokenId === token.id;
        const destLabel = isLocation ? getDestinationLabel(token) : "";
        const displayLabel = isLocation && destLabel ? destLabel : token.label;

        if (isLocation) {
          return (
            <Group
              key={token.id}
              x={token.x}
              y={token.y}
              draggable={interactive}
              onDragEnd={(e) => handleDragEnd(token.id, e)}
              onContextMenu={interactive ? (e) => handleContextMenu(token.id, e) : undefined}
              onClick={() => handleLocationClick(token)}
              onTap={() => handleLocationClick(token)}
              onMouseEnter={() => setHoveredTokenId(token.id)}
              onMouseLeave={() => setHoveredTokenId(null)}
            >
              {/* Diamond shape for location tokens */}
              <Rect
                width={LOCATION_SIZE}
                height={LOCATION_SIZE}
                offsetX={LOCATION_SIZE / 2}
                offsetY={LOCATION_SIZE / 2}
                rotation={45}
                fill={color}
                stroke={isBroken ? "#EF4444" : "#1F2937"}
                strokeWidth={isBroken ? 3 : 2}
              />
              {/* Center dot */}
              <Circle
                radius={6}
                fill="#1F2937"
              />
              {/* Label below */}
              <Text
                text={displayLabel}
                fontSize={11}
                fill="#1F2937"
                align="center"
                y={LOCATION_SIZE / 2 + 4}
                width={100}
                offsetX={50}
              />
              {/* Broken link indicator */}
              {isBroken && (
                <Text
                  text="⚠"
                  fontSize={16}
                  x={LOCATION_SIZE / 2 - 4}
                  y={-LOCATION_SIZE / 2 - 4}
                />
              )}
              {/* Tooltip on hover */}
              {isHovered && token.destinationMapLevelId && getTooltipText(token) && (
                <Label x={0} y={-LOCATION_SIZE / 2 - 24} opacity={0.95}>
                  <Tag
                    fill="#1F2937"
                    cornerRadius={4}
                    pointerDirection="down"
                    pointerWidth={8}
                    pointerHeight={6}
                  />
                  <Text
                    text={getTooltipText(token)}
                    fontSize={11}
                    fill="#FFFFFF"
                    padding={6}
                  />
                </Label>
              )}
            </Group>
          );
        }

        // Regular token (player, npc, monster)
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
