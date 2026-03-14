"use client";

import { useEffect, useRef, useState } from "react";
import { Layer, Rect, Group } from "react-konva";
import type { FogZone } from "@/types/api";

type ViewMode = "gm" | "preview" | "player";

const FOG_EXTENT = 20000;
const TILE_SIZE = 1024;

// --- Seamless tileable Perlin noise ---

function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number) {
  return a + t * (b - a);
}

function createPermutation(size: number): number[] {
  const p = Array.from({ length: size }, (_, i) => i);
  // Fisher-Yates with fixed seed for determinism
  let seed = 42;
  for (let i = size - 1; i > 0; i--) {
    seed = (seed * 16807) % 2147483647;
    const j = seed % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  return [...p, ...p];
}

const GRID = 8; // grid cells per tile (controls cloud scale)
const perm = createPermutation(256);
const gradients = [
  [1, 1], [1, -1], [-1, 1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

function grad(hash: number, x: number, y: number): number {
  const g = gradients[hash & 7];
  return g[0] * x + g[1] * y;
}

function perlinNoise(px: number, py: number): number {
  // Wrap grid coordinates for seamless tiling
  const xi = Math.floor(px) % GRID;
  const yi = Math.floor(py) % GRID;
  const xf = px - Math.floor(px);
  const yf = py - Math.floor(py);

  const u = fade(xf);
  const v = fade(yf);

  const xi1 = (xi + 1) % GRID;
  const yi1 = (yi + 1) % GRID;

  const aa = perm[perm[xi] + yi];
  const ab = perm[perm[xi] + yi1];
  const ba = perm[perm[xi1] + yi];
  const bb = perm[perm[xi1] + yi1];

  return lerp(
    lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
    lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
    v
  );
}

function fbmNoise(x: number, y: number, octaves: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let max = 0;

  for (let i = 0; i < octaves; i++) {
    value += perlinNoise(x * frequency, y * frequency) * amplitude;
    max += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / max;
}

function generateFogTexture(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(TILE_SIZE, TILE_SIZE);
  const data = imageData.data;

  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const nx = (x / TILE_SIZE) * GRID;
      const ny = (y / TILE_SIZE) * GRID;

      // Multi-octave noise for cloud-like pattern
      const noise = fbmNoise(nx, ny, 6);
      // Map from [-1,1] to [0,1] range
      const val = (noise + 1) * 0.5;

      // Smoky wisps: visible texture but NOT opaque
      const wisp = Math.floor(val * 120);
      const alpha = Math.floor(val * val * 100); // 0-100 alpha: transparent base, denser wisps

      const idx = (y * TILE_SIZE + x) * 4;
      data[idx] = 140 + wisp; // light gray-white smoke
      data[idx + 1] = 145 + wisp;
      data[idx + 2] = 155 + wisp;
      data[idx + 3] = alpha;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// ---

interface FogOverlayLayerProps {
  fogZones?: FogZone[];
  stageWidth: number;
  stageHeight: number;
  viewMode?: ViewMode;
}

export function FogOverlayLayer({
  fogZones,
  viewMode = "player",
}: FogOverlayLayerProps) {
  const [fogImage, setFogImage] = useState<HTMLCanvasElement | null>(null);
  const textureRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!textureRef.current) {
      textureRef.current = generateFogTexture();
      setFogImage(textureRef.current);
    }
  }, []);

  if (viewMode === "gm" && (!fogZones || fogZones.length === 0)) {
    return null;
  }

  const revealedZones = (fogZones ?? []).filter((zone) => zone.revealed);
  const overlayOpacity = viewMode === "gm" ? 0.35 : 1;

  return (
    <Layer listening={false}>
      {/* Group 1: opaque dark base with cutouts */}
      <Group>
        <Rect
          x={-FOG_EXTENT / 2}
          y={-FOG_EXTENT / 2}
          width={FOG_EXTENT}
          height={FOG_EXTENT}
          fill="#111827"
          opacity={overlayOpacity}
        />
        {revealedZones.map((zone) => (
          <Rect
            key={zone.id}
            x={zone.x}
            y={zone.y}
            width={zone.width}
            height={zone.height}
            fill="#111827"
            globalCompositeOperation="destination-out"
            shadowColor="#111827"
            shadowBlur={60}
            shadowOpacity={1}
          />
        ))}
      </Group>
      {/* Group 2: smoke texture on top with same cutouts */}
      {fogImage && (
        <Group>
          <Rect
            x={-FOG_EXTENT / 2}
            y={-FOG_EXTENT / 2}
            width={FOG_EXTENT}
            height={FOG_EXTENT}
            fillPatternImage={fogImage as unknown as HTMLImageElement}
            fillPatternRepeat="repeat"
            opacity={overlayOpacity}
          />
          {revealedZones.map((zone) => (
            <Rect
              key={`smoke-${zone.id}`}
              x={zone.x}
              y={zone.y}
              width={zone.width}
              height={zone.height}
              fill="#fff"
              globalCompositeOperation="destination-out"
              shadowColor="#fff"
              shadowBlur={80}
              shadowOpacity={1}
            />
          ))}
        </Group>
      )}
    </Layer>
  );
}
