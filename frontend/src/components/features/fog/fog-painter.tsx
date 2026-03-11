"use client";

import { useState, useRef, useCallback } from "react";
import { Layer, Rect } from "react-konva";
import type Konva from "konva";

interface FogZoneDraft {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FogPainterProps {
  active: boolean;
  onFogPaint: (zone: { x: number; y: number; width: number; height: number }) => void;
}

export function FogPainter({ active, onFogPaint }: FogPainterProps) {
  const [draft, setDraft] = useState<FogZoneDraft | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const isPainting = useRef(false);

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!active) return;
      const stage = e.target.getStage();
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scale = stage.scaleX();
      const stagePos = stage.position();
      const x = (pointer.x - stagePos.x) / scale;
      const y = (pointer.y - stagePos.y) / scale;

      isPainting.current = true;
      startPos.current = { x, y };
      setDraft({ x, y, width: 0, height: 0 });
    },
    [active]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isPainting.current || !startPos.current || !active) return;

      const stage = e.target.getStage();
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scale = stage.scaleX();
      const stagePos = stage.position();
      const currentX = (pointer.x - stagePos.x) / scale;
      const currentY = (pointer.y - stagePos.y) / scale;

      const x = Math.min(startPos.current.x, currentX);
      const y = Math.min(startPos.current.y, currentY);
      const width = Math.abs(currentX - startPos.current.x);
      const height = Math.abs(currentY - startPos.current.y);

      setDraft({ x, y, width, height });
    },
    [active]
  );

  const handleMouseUp = useCallback(() => {
    if (!isPainting.current || !draft || !active) return;

    isPainting.current = false;
    startPos.current = null;

    if (draft.width > 5 && draft.height > 5) {
      onFogPaint({
        x: Math.round(draft.x),
        y: Math.round(draft.y),
        width: Math.round(draft.width),
        height: Math.round(draft.height),
      });
    }

    setDraft(null);
  }, [draft, active, onFogPaint]);

  if (!active) return null;

  return (
    <Layer
      listening={active}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Invisible full-area rect to capture mouse events */}
      <Rect
        x={-10000}
        y={-10000}
        width={20000}
        height={20000}
        fill="transparent"
        listening={active}
      />
      {/* Draft rectangle preview */}
      {draft && draft.width > 0 && draft.height > 0 && (
        <Rect
          x={draft.x}
          y={draft.y}
          width={draft.width}
          height={draft.height}
          fill="rgba(59, 130, 246, 0.3)"
          stroke="rgba(59, 130, 246, 0.8)"
          strokeWidth={2}
          dash={[6, 3]}
          data-testid="fog-draft-rect"
        />
      )}
    </Layer>
  );
}
