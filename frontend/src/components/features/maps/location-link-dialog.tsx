"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { MapLevel } from "@/types/api";
import { formatMapLevelPath } from "@/lib/utils/map-path";
import { MapPin } from "lucide-react";

interface LocationLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapLevels: MapLevel[];
  currentMapLevelId: string;
  onSelect: (destinationMapLevelId: string) => void;
  onCancel: () => void;
  initialDestinationId?: string;
}

export function LocationLinkDialog({
  open,
  onOpenChange,
  mapLevels,
  currentMapLevelId,
  onSelect,
  onCancel,
  initialDestinationId,
}: LocationLinkDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialDestinationId ?? null
  );

  const childLevels = mapLevels.filter(
    (l) => l.parentId === currentMapLevelId
  );
  const otherLevels = mapLevels.filter(
    (l) => l.id !== currentMapLevelId && l.parentId !== currentMapLevelId
  );

  const displayLevels =
    childLevels.length > 0
      ? childLevels
      : mapLevels.filter((l) => l.id !== currentMapLevelId);

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Destination Map Level
          </DialogTitle>
          <DialogDescription>
            Choose the map level this location token links to.
            {childLevels.length > 0
              ? " Showing child levels first."
              : " No child levels found — showing all available levels."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto space-y-1 py-2">
          {childLevels.length > 0 && (
            <>
              <p className="text-xs font-medium text-muted-foreground px-2 mb-1">
                Child Levels
              </p>
              {childLevels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedId === level.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => setSelectedId(level.id)}
                >
                  {level.name}
                </button>
              ))}
              {otherLevels.length > 0 && (
                <>
                  <p className="text-xs font-medium text-muted-foreground px-2 mt-3 mb-1">
                    Other Levels
                  </p>
                  {otherLevels.map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedId === level.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => setSelectedId(level.id)}
                    >
                      <span>{level.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatMapLevelPath(mapLevels, level.id)}
                      </span>
                    </button>
                  ))}
                </>
              )}
            </>
          )}
          {childLevels.length === 0 &&
            displayLevels.map((level) => (
              <button
                key={level.id}
                type="button"
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedId === level.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
                onClick={() => setSelectedId(level.id)}
              >
                <span>{level.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {formatMapLevelPath(mapLevels, level.id)}
                </span>
              </button>
            ))}
          {displayLevels.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No other map levels available. Create a child level first.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedId}>
            Link Destination
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
