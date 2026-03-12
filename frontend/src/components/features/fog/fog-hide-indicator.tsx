"use client";

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { Rect } from "react-konva";
import type Konva from "konva";
import type { FogZone } from "@/types/api";

const HIDE_ANIMATION_DURATION_MS = 1000;

function subscribeToPrefersReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getPrefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getPrefersReducedMotionServer() {
  return false;
}

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
}: FogHideIndicatorProps) {
  const [hiddenZones, setHiddenZones] = useState<RemovedZone[]>([]);
  const previousZonesRef = useRef<Map<string, FogZone>>(new Map());
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToPrefersReducedMotion,
    getPrefersReducedMotion,
    getPrefersReducedMotionServer,
  );

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

    if (removed.length === 0) return;

    if (prefersReducedMotion) {
      return;
    }

    setHiddenZones((prev) => [...prev, ...removed]);

    const removedIds = new Set(removed.map((r) => r.id));
    const timer = setTimeout(() => {
      setHiddenZones((prev) => prev.filter((z) => !removedIds.has(z.id)));
    }, HIDE_ANIMATION_DURATION_MS);

    return () => clearTimeout(timer);
  }, [fogZones, prefersReducedMotion]);

  if (!isTargetedView) return null;

  return (
    <>
      {hiddenZones.map((zone) => (
        <FadeRect key={`hide-fade-${zone.id}`} zone={zone} />
      ))}
    </>
  );
}
