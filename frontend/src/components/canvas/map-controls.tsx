"use client";

import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export function MapControls({ onZoomIn, onZoomOut, onResetZoom }: MapControlsProps) {
  return (
    <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
      <Button variant="outline" size="icon" onClick={onZoomIn} title="Zoom in" aria-label="Zoom in">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={onZoomOut} title="Zoom out" aria-label="Zoom out">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={onResetZoom} title="Reset zoom" aria-label="Reset zoom">
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
}
