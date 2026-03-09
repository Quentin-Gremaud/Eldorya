"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { BackpackItem } from "@/types/api";
import { ItemCard } from "@/components/shared/item-card";
import { CSS } from "@dnd-kit/utilities";

interface DraggableItemProps {
  item: BackpackItem;
  isEditable: boolean;
  isSelected?: boolean;
  onSelect?: (itemId: string) => void;
}

function DraggableItem({ item, isEditable, isSelected, onSelect }: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `backpack-${item.id}`,
    data: { type: "backpack", item },
    disabled: !isEditable,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isEditable ? { ...listeners, ...attributes } : {})}
      className={`${isEditable ? "cursor-grab" : "cursor-default"} rounded-lg ${isSelected ? "ring-2 ring-accent-primary" : ""}`}
      aria-label={`Backpack item: ${item.name}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(item.id);
      }}
    >
      <ItemCard
        item={{
          ...item,
          equippedSlot: null,
          position: item.position,
        }}
        compact
      />
    </div>
  );
}

interface BackpackSlotDroppableProps {
  position: number;
  children?: React.ReactNode;
}

function BackpackSlotDroppable({
  position,
  children,
}: BackpackSlotDroppableProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `backpack-slot-${position}`,
    data: { type: "backpack-slot", position },
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[40px] rounded-lg border border-dashed p-1 transition-colors ${
        isOver
          ? "border-accent-primary bg-accent-primary/10"
          : "border-border"
      }`}
    >
      {children}
    </div>
  );
}

interface BackpackGridProps {
  backpackItems: BackpackItem[];
  isEditable: boolean;
  onItemSelect?: (itemId: string | null) => void;
  selectedItemId?: string | null;
}

export function BackpackGrid({ backpackItems, isEditable, onItemSelect, selectedItemId }: BackpackGridProps) {
  const sortedItems = [...backpackItems].sort(
    (a, b) => a.position - b.position
  );

  const maxPosition =
    sortedItems.length > 0
      ? Math.max(...sortedItems.map((i) => i.position))
      : -1;
  const gridSize = Math.max(maxPosition + 2, 4);

  const itemsByPosition = new Map(
    sortedItems.map((item) => [item.position, item])
  );

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-text-secondary">
        Backpack
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: gridSize }, (_, i) => {
          const item = itemsByPosition.get(i);
          return (
            <BackpackSlotDroppable key={i} position={i}>
              {item && (
                <DraggableItem
                  item={item}
                  isEditable={isEditable}
                  isSelected={selectedItemId === item.id}
                  onSelect={(id) =>
                    onItemSelect?.(selectedItemId === id ? null : id)
                  }
                />
              )}
            </BackpackSlotDroppable>
          );
        })}
      </div>
    </div>
  );
}
