"use client";

import { useState, useEffect, useRef } from "react";
import { Rect } from "react-konva";
import type { FogZone } from "@/types/api";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const REVEAL_ANIMATION_DURATION_MS = 2000;

interface FogRevealIndicatorProps {
  fogZones: FogZone[];
  isTargetedView: boolean;
  viewMode?: "gm" | "player" | "preview";
}

export function FogRevealIndicator({
  fogZones,
  isTargetedView,
  viewMode,
}: FogRevealIndicatorProps) {
  const [newZoneIds, setNewZoneIds] = useState<Set<string>>(new Set());
  const previousZoneIdsRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const prefersReducedMotion = usePrefersReducedMotion();

  const shouldAnimate = viewMode === "player" || isTargetedView;

  useEffect(() => {
    const currentIds = new Set(fogZones.map((z) => z.id));
    const previousIds = previousZoneIdsRef.current;

    const addedIds = new Set<string>();
    for (const id of currentIds) {
      if (!previousIds.has(id)) {
        addedIds.add(id);
      }
    }

    previousZoneIdsRef.current = currentIds;

    if (addedIds.size === 0 || !shouldAnimate) return;

    setNewZoneIds((prev) => new Set([...prev, ...addedIds]));

    if (prefersReducedMotion) {
      setNewZoneIds(new Set());
      return;
    }

    for (const id of addedIds) {
      const existing = timersRef.current.get(id);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        setNewZoneIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        timersRef.current.delete(id);
      }, REVEAL_ANIMATION_DURATION_MS);
      timersRef.current.set(id, timer);
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

  const animatingZones = fogZones.filter((z) => newZoneIds.has(z.id));

  return (
    <>
      {animatingZones.map((zone) => (
        <Rect
          key={`reveal-glow-${zone.id}`}
          x={zone.x - 3}
          y={zone.y - 3}
          width={zone.width + 6}
          height={zone.height + 6}
          stroke="rgba(147, 197, 253, 0.7)"
          strokeWidth={3}
          cornerRadius={2}
          shadowColor="rgba(147, 197, 253, 0.5)"
          shadowBlur={12}
          shadowOffsetX={0}
          shadowOffsetY={0}
          listening={false}
          data-testid={`fog-reveal-glow-${zone.id}`}
        />
      ))}
    </>
  );
}
