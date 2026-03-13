"use client";

import { useState, useEffect, useRef } from "react";
import { Rect } from "react-konva";
import type Konva from "konva";
import type { FogZone } from "@/types/api";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const HIDE_ANIMATION_DURATION_MS = 1000;

interface RemovedZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FogHideIndicatorProps {
  fogZones: FogZone[];
  isTargetedView: boolean;
  viewMode?: "gm" | "player" | "preview";
}

function FadeRect({ zone }: { zone: RemovedZone }) {
  const rectRef = useRef<Konva.Rect>(null);

  useEffect(() => {
    const node = rectRef.current;
    if (!node) return;
    node.opacity(0);
    node.to({
      opacity: 1,
      duration: HIDE_ANIMATION_DURATION_MS / 1000,
    });
  }, []);

  return (
    <Rect
      ref={rectRef}
      x={zone.x}
      y={zone.y}
      width={zone.width}
      height={zone.height}
      fill="rgba(0, 0, 0, 0.6)"
      stroke="rgba(239, 68, 68, 0.5)"
      strokeWidth={2}
      cornerRadius={2}
      opacity={0}
      listening={false}
      data-testid={`fog-hide-fade-${zone.id}`}
    />
  );
}

export function FogHideIndicator({
  fogZones,
  isTargetedView,
  viewMode,
}: FogHideIndicatorProps) {
  const [hiddenZones, setHiddenZones] = useState<RemovedZone[]>([]);
  const previousZonesRef = useRef<Map<string, FogZone>>(new Map());
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const prefersReducedMotion = usePrefersReducedMotion();

  const shouldAnimate = viewMode === "player" || isTargetedView;

  useEffect(() => {
    const currentIds = new Set(fogZones.map((z) => z.id));
    const previousZones = previousZonesRef.current;

    const removed: RemovedZone[] = [];
    for (const [id, zone] of previousZones) {
      if (!currentIds.has(id)) {
        removed.push({
          id,
          x: zone.x,
          y: zone.y,
          width: zone.width,
          height: zone.height,
        });
      }
    }

    previousZonesRef.current = new Map(fogZones.map((z) => [z.id, z]));

    if (removed.length === 0 || !shouldAnimate) return;

    if (prefersReducedMotion) {
      return;
    }

    setHiddenZones((prev) => [...prev, ...removed]);

    for (const zone of removed) {
      const existing = timersRef.current.get(zone.id);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        setHiddenZones((prev) => prev.filter((z) => z.id !== zone.id));
        timersRef.current.delete(zone.id);
      }, HIDE_ANIMATION_DURATION_MS);
      timersRef.current.set(zone.id, timer);
    }
  }, [fogZones, prefersReducedMotion, shouldAnimate]);

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  if (!shouldAnimate) return null;

  return (
    <>
      {hiddenZones.map((zone) => (
        <FadeRect key={`hide-fade-${zone.id}`} zone={zone} />
      ))}
    </>
  );
}
