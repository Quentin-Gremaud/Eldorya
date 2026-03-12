"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Stage } from "react-konva";
import type Konva from "konva";
import type { MapLevel, Token, FogZone } from "@/types/api";
import type { FogTool } from "@/components/features/fog/fog-toolbar";
import { MapBackgroundLayer } from "./map-background-layer";
import { TokenLayer, type ViewMode } from "./token-layer";
import { FogOverlayLayer } from "./fog-overlay-layer";
import { FogPainter } from "@/components/features/fog/fog-painter";
import { FogRevealIndicator } from "@/components/features/fog/fog-reveal-indicator";
import { FogHideIndicator } from "@/components/features/fog/fog-hide-indicator";
import { MapControls } from "./map-controls";

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_STEP = 1.2;

interface MapCanvasProps {
  mapLevel: MapLevel;
  tokens: Token[];
  interactive: boolean;
  viewMode?: ViewMode;
  playerId?: string;
  fogZones?: FogZone[];
  activeTool?: FogTool;
  onFogPaint?: (zone: { x: number; y: number; width: number; height: number }) => void;
  onTokenPlace?: (
    tokenId: string,
    mapLevelId: string,
    x: number,
    y: number,
    tokenType: string,
    label: string
  ) => void;
  onTokenMove?: (tokenId: string, x: number, y: number) => void;
  onTokenRemove?: (tokenId: string) => void;
}

export function MapCanvas({
  mapLevel,
  tokens,
  interactive,
  viewMode = "gm",
  playerId,
  fogZones,
  activeTool = "select",
  onFogPaint,
  onTokenPlace,
  onTokenMove,
  onTokenRemove,
}: MapCanvasProps) {
  const isGmMode = viewMode === "gm";
  const isFogToolActive = activeTool === "fog-reveal" || activeTool === "fog-reveal-all" || activeTool === "fog-hide" || activeTool === "fog-hide-all";
  const effectiveInteractive = interactive && isGmMode && !isFogToolActive;
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [contextMenu, setContextMenu] = useState<{
    tokenId: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    setDimensions({
      width: container.clientWidth,
      height: container.clientHeight,
    });

    return () => observer.disconnect();
  }, []);

  const handleImageLoad = useCallback((dims: { width: number; height: number }) => {
    setImageDimensions(dims);
    // Auto-fit: scale so the full image fits in the viewport
    const container = containerRef.current;
    if (!container) return;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const fitScale = Math.min(containerWidth / dims.width, containerHeight / dims.height, 1);
    const offsetX = (containerWidth - dims.width * fitScale) / 2;
    const offsetY = (containerHeight - dims.height * fitScale) / 2;

    const stage = stageRef.current;
    if (stage) {
      stage.scale({ x: fitScale, y: fitScale });
      stage.position({ x: offsetX, y: offsetY });
      stage.batchDraw();
    }
    setScale(fitScale);
  }, []);

  const handleFitToImage = useCallback(() => {
    if (!imageDimensions || !containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const fitScale = Math.min(containerWidth / imageDimensions.width, containerHeight / imageDimensions.height, 1);
    const offsetX = (containerWidth - imageDimensions.width * fitScale) / 2;
    const offsetY = (containerHeight - imageDimensions.height * fitScale) / 2;

    const stage = stageRef.current;
    if (stage) {
      stage.scale({ x: fitScale, y: fitScale });
      stage.position({ x: offsetX, y: offsetY });
      stage.batchDraw();
    }
    setScale(fitScale);
  }, [imageDimensions]);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(
      MIN_SCALE,
      Math.min(MAX_SCALE, direction > 0 ? oldScale * ZOOM_STEP : oldScale / ZOOM_STEP)
    );

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
    stage.batchDraw();
    setScale(newScale);
  }, []);

  const zoomToCenter = useCallback((newScale: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const center = {
      x: stage.width() / 2,
      y: stage.height() / 2,
    };
    const pointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };
    stage.scale({ x: newScale, y: newScale });
    stage.position({
      x: center.x - pointTo.x * newScale,
      y: center.y - pointTo.y * newScale,
    });
    stage.batchDraw();
    setScale(newScale);
  }, []);

  const handleZoomIn = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const newScale = Math.min(MAX_SCALE, stage.scaleX() * ZOOM_STEP);
    zoomToCenter(newScale);
  }, [zoomToCenter]);

  const handleZoomOut = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const newScale = Math.max(MIN_SCALE, stage.scaleX() / ZOOM_STEP);
    zoomToCenter(newScale);
  }, [zoomToCenter]);

  const handleResetZoom = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();
    setScale(1);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!onTokenPlace || !stageRef.current) return;

      const tokenType = e.dataTransfer.getData("tokenType");
      const label = e.dataTransfer.getData("label");
      if (!tokenType || !label) return;

      const stage = stageRef.current;
      const stageBox = stage.container().getBoundingClientRect();
      const stageScale = stage.scaleX();
      const stagePos = stage.position();

      const x = Math.round(
        (e.clientX - stageBox.left - stagePos.x) / stageScale
      );
      const y = Math.round(
        (e.clientY - stageBox.top - stagePos.y) / stageScale
      );

      const tokenId = crypto.randomUUID();
      onTokenPlace(tokenId, mapLevel.id, x, y, tokenType, label);
    },
    [onTokenPlace, mapLevel.id]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleContextMenu = useCallback(
    (tokenId: string, x: number, y: number) => {
      setContextMenu({ tokenId, x, y });
    },
    []
  );

  const handleRemoveToken = useCallback(() => {
    if (contextMenu && onTokenRemove) {
      onTokenRemove(contextMenu.tokenId);
    }
    setContextMenu(null);
  }, [contextMenu, onTokenRemove]);

  const handleStageClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{ cursor: isFogToolActive ? "crosshair" : undefined }}
      onDrop={isGmMode && !isFogToolActive ? handleDrop : undefined}
      onDragOver={isGmMode && !isFogToolActive ? handleDragOver : undefined}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        draggable={!isFogToolActive}
        onWheel={handleWheel}
        onClick={isFogToolActive ? undefined : handleStageClick}
      >
        <MapBackgroundLayer backgroundImageUrl={mapLevel.backgroundImageUrl} onImageLoad={handleImageLoad} />
        <TokenLayer
          tokens={tokens}
          interactive={effectiveInteractive}
          viewMode={viewMode}
          fogZones={fogZones}
          onTokenMove={effectiveInteractive ? onTokenMove : undefined}
          onContextMenu={effectiveInteractive ? handleContextMenu : undefined}
        />
        <FogOverlayLayer
          fogZones={fogZones}
          stageWidth={dimensions.width}
          stageHeight={dimensions.height}
          viewMode={viewMode}
        />
        {isFogToolActive && onFogPaint && (
          <FogPainter active={isFogToolActive} onFogPaint={onFogPaint} />
        )}
        {fogZones && fogZones.length > 0 && (
          <FogRevealIndicator
            fogZones={fogZones}
            isTargetedView={viewMode === "preview" && !!playerId}
          />
        )}
        {fogZones && (
          <FogHideIndicator
            fogZones={fogZones}
            isTargetedView={viewMode === "preview" && !!playerId}
          />
        )}
      </Stage>

      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFitToImage={imageDimensions ? handleFitToImage : undefined}
      />

      {/* Context menu for token removal */}
      {isGmMode && contextMenu && (
        <div
          role="menu"
          className="absolute z-20 bg-popover border rounded-md shadow-md py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            role="menuitem"
            aria-label="Remove token"
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            onClick={handleRemoveToken}
          >
            Remove Token
          </button>
        </div>
      )}
    </div>
  );
}
