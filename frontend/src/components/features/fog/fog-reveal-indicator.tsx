"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { Rect } from "react-konva";
import type { FogZone } from "@/types/api";

const REVEAL_ANIMATION_DURATION_MS = 2000;

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

interface FogRevealIndicatorProps {
  fogZones: FogZone[];
  isTargetedView: boolean;
}

export function FogRevealIndicator({
  fogZones,
  isTargetedView,
}: FogRevealIndicatorProps) {
  const [newZoneIds, setNewZoneIds] = useState<Set<string>>(new Set());
  const previousZoneIdsRef = useRef<Set<string>>(new Set());
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToPrefersReducedMotion,
    getPrefersReducedMotion,
    getPrefersReducedMotionServer,
  );

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

    if (addedIds.size === 0) return;

    setNewZoneIds((prev) => new Set([...prev, ...addedIds]));

    if (prefersReducedMotion) {
      setNewZoneIds(new Set());
      return;
    }

    const timer = setTimeout(() => {
      setNewZoneIds((prev) => {
        const next = new Set(prev);
        for (const id of addedIds) {
          next.delete(id);
        }
        return next;
      });
    }, REVEAL_ANIMATION_DURATION_MS);

    return () => clearTimeout(timer);
  }, [fogZones, prefersReducedMotion]);

  if (!isTargetedView) return null;

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
