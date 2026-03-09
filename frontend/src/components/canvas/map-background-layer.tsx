"use client";

import { useEffect, useState } from "react";
import { Layer, Image as KonvaImage, Text } from "react-konva";

interface MapBackgroundLayerProps {
  backgroundImageUrl: string | null;
}

export function MapBackgroundLayer({
  backgroundImageUrl,
}: MapBackgroundLayerProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!backgroundImageUrl) {
      setImage(null);
      setLoadError(false);
      return;
    }

    setLoadError(false);
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = backgroundImageUrl;
    img.onload = () => setImage(img);
    img.onerror = () => setLoadError(true);

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [backgroundImageUrl]);

  return (
    <Layer listening={false}>
      {image && (
        <KonvaImage image={image} x={0} y={0} width={image.width} height={image.height} />
      )}
      {loadError && (
        <Text
          text="Failed to load background image"
          x={20}
          y={20}
          fontSize={14}
          fill="#EF4444"
        />
      )}
    </Layer>
  );
}
