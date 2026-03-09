"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MapLevel } from "@/types/api";

interface MapLevelTreeItemProps {
  level: MapLevel;
  children: MapLevel[];
  allLevels: MapLevel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

export function MapLevelTreeItem({
  level,
  children,
  allLevels,
  selectedId,
  onSelect,
  onRename,
}: MapLevelTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(level.name);

  const hasChildren = children.length > 0;
  const isSelected = selectedId === level.id;

  const handleRename = () => {
    if (editName.trim() && editName.trim() !== level.name) {
      onRename(level.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(level.name);
    setIsEditing(false);
  };

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div
        className={cn(
          "group flex items-center gap-1 rounded px-2 py-1 cursor-pointer hover:bg-accent/50",
          isSelected && "bg-accent"
        )}
        style={{ paddingLeft: `${level.depth * 16 + 8}px` }}
      >
        <button
          type="button"
          className="w-4 h-4 flex items-center justify-center shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setIsExpanded(!isExpanded);
          }}
          aria-label={hasChildren ? (isExpanded ? "Collapse" : "Expand") : undefined}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          ) : null}
        </button>

        {isEditing ? (
          <div className="flex items-center gap-1 flex-1">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-6 text-sm py-0"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") handleCancelEdit();
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleRename}
              aria-label="Confirm rename"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleCancelEdit}
              aria-label="Cancel rename"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            <span
              className="flex-1 text-sm truncate"
              onClick={() => onSelect(level.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSelect(level.id);
              }}
            >
              {level.name}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                setEditName(level.name);
                setIsEditing(true);
              }}
              aria-label="Rename"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div role="group">
          {children.map((child) => (
            <MapLevelTreeItem
              key={child.id}
              level={child}
              children={allLevels.filter((l) => l.parentId === child.id)}
              allLevels={allLevels}
              selectedId={selectedId}
              onSelect={onSelect}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}
