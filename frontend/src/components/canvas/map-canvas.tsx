"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Stage } from "react-konva";
import type Konva from "konva";
import type { MapLevel, Token } from "@/types/api";
import { MapBackgroundLayer } from "./map-background-layer";
import { TokenLayer } from "./token-layer";
import { MapControls } from "./map-controls";

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_STEP = 1.2;

interface MapCanvasProps {
  mapLevel: MapLevel;
  tokens: Token[];
  interactive: boolean;
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
  onTokenPlace,
  onTokenMove,
  onTokenRemove,
}: MapCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
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
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        draggable
        onWheel={handleWheel}
        onClick={handleStageClick}
      >
        <MapBackgroundLayer backgroundImageUrl={mapLevel.backgroundImageUrl} />
        <TokenLayer
          tokens={tokens}
          interactive={interactive}
          onTokenMove={onTokenMove}
          onContextMenu={handleContextMenu}
        />
      </Stage>

      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />

      {/* Context menu for token removal */}
      {contextMenu && (
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
