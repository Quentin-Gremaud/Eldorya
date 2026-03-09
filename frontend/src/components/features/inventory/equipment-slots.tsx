"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { InventoryItem, EquipmentSlotType } from "@/types/api";
import { ItemCard } from "@/components/shared/item-card";
import { Plus } from "lucide-react";

const SLOT_LABELS: Record<EquipmentSlotType, string> = {
  head: "Head",
  torso: "Torso",
  hands: "Hands",
  legs: "Legs",
  feet: "Feet",
  ring1: "Ring 1",
  ring2: "Ring 2",
  weapon_shield: "Weapon",
};

const SLOT_ORDER: EquipmentSlotType[] = [
  "head",
  "torso",
  "hands",
  "legs",
  "feet",
  "ring1",
  "ring2",
  "weapon_shield",
];

interface EquipmentSlotCellProps {
  slotType: EquipmentSlotType;
  item: InventoryItem | null;
  isEditable: boolean;
  isOver: boolean;
  isIncompatible: boolean;
  onEmptySlotClick?: (slotType: EquipmentSlotType) => void;
}

function EquipmentSlotCell({
  slotType,
  item,
  isEditable,
  isOver,
  isIncompatible,
  onEmptySlotClick,
}: EquipmentSlotCellProps) {
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `equipment-${slotType}`,
    data: { type: "equipment", slotType },
    disabled: !isEditable,
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `equipment-drag-${slotType}`,
    data: { type: "equipment", slotType, item },
    disabled: !isEditable || !item,
  });

  const draggableStyle = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const borderClass = isIncompatible
    ? "border-danger"
    : isOver
      ? "border-accent-primary"
      : item
        ? "border-border"
        : "border-dashed border-border";

  return (
    <div
      ref={setDroppableRef}
      className={`flex flex-col items-center justify-center rounded-lg border-2 p-2 min-h-[80px] transition-colors ${borderClass} bg-surface-elevated`}
      aria-label={`${SLOT_LABELS[slotType]} slot${item ? `: ${item.name}` : " (empty)"}`}
    >
      {item ? (
        <div
          ref={setDraggableRef}
          style={draggableStyle}
          {...(isEditable ? { ...listeners, ...attributes } : {})}
          className={isEditable ? "cursor-grab" : "cursor-default"}
        >
          <ItemCard item={item} compact />
        </div>
      ) : (
        <button
          type="button"
          className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:text-accent-primary transition-colors disabled:cursor-default disabled:hover:text-text-muted"
          disabled={!isEditable || !onEmptySlotClick}
          onClick={() => onEmptySlotClick?.(slotType)}
          aria-label={`Add item to ${SLOT_LABELS[slotType]} slot`}
        >
          <Plus className="h-4 w-4 text-current" />
          <span className="mt-1 text-xs text-current">
            {SLOT_LABELS[slotType]}
          </span>
        </button>
      )}
    </div>
  );
}

interface EquipmentSlotsProps {
  equipmentSlots: Record<EquipmentSlotType, InventoryItem | null>;
  isEditable: boolean;
  activeSlotType?: string | null;
  dragItemSlotType?: string | null;
  onEmptySlotClick?: (slotType: EquipmentSlotType) => void;
}

export function EquipmentSlots({
  equipmentSlots,
  isEditable,
  activeSlotType,
  dragItemSlotType,
  onEmptySlotClick,
}: EquipmentSlotsProps) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-text-secondary">
        Equipment
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {SLOT_ORDER.map((slotType) => {
          const isOver = activeSlotType === slotType;
          const isIncompatible =
            isOver && dragItemSlotType !== null && dragItemSlotType !== slotType;

          return (
            <EquipmentSlotCell
              key={slotType}
              slotType={slotType}
              item={(equipmentSlots[slotType] as InventoryItem | null) ?? null}
              isEditable={isEditable}
              isOver={isOver}
              isIncompatible={isIncompatible}
              onEmptySlotClick={onEmptySlotClick}
            />
          );
        })}
      </div>
    </div>
  );
}
