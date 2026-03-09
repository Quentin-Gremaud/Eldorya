"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import type { Inventory, BackpackItem, EquipmentSlotType } from "@/types/api";
import { processDragEnd } from "./handle-drag-end";
import { Trash2 } from "lucide-react";
import { EquipmentSlots } from "./equipment-slots";
import { BackpackGrid } from "./backpack-grid";
import { WeightBar } from "./weight-bar";

function DropZone() {
  const { setNodeRef, isOver } = useDroppable({
    id: "drop-zone",
    data: { type: "drop-zone" },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 transition-colors ${
        isOver
          ? "border-danger bg-danger/10 text-danger"
          : "border-border text-text-muted"
      }`}
    >
      <Trash2 className="h-4 w-4" />
      <span className="text-sm">Drop to discard</span>
    </div>
  );
}

interface InventoryGridProps {
  inventory: Inventory;
  isEditable: boolean;
  onEquipItem: (itemId: string, slotType: string) => void;
  onUnequipItem: (itemId: string) => void;
  onMoveItem: (itemId: string, toPosition: number) => void;
  onDropItem: (itemId: string) => void;
  onItemSelect?: (itemId: string | null) => void;
  selectedItemId?: string | null;
  onEmptySlotClick?: (slotType: EquipmentSlotType) => void;
  onMaxCapacityChange?: (newMaxCapacity: number) => void;
}

export function InventoryGrid({
  inventory,
  isEditable,
  onEquipItem,
  onUnequipItem,
  onMoveItem,
  onDropItem,
  onItemSelect,
  selectedItemId,
  onEmptySlotClick,
  onMaxCapacityChange,
}: InventoryGridProps) {
  const [activeSlotType, setActiveSlotType] = useState<string | null>(null);
  const [dragItemSlotType, setDragItemSlotType] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === "backpack") {
      const item = data.item as BackpackItem;
      setDragItemSlotType(item.slotType);
    } else if (data?.type === "equipment") {
      setDragItemSlotType(data.slotType as string);
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const over = event.over;
    if (over?.data.current?.type === "equipment") {
      setActiveSlotType(over.data.current.slotType as string);
    } else {
      setActiveSlotType(null);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveSlotType(null);
      setDragItemSlotType(null);
      processDragEnd(event, { onEquipItem, onUnequipItem, onMoveItem, onDropItem });
    },
    [onEquipItem, onMoveItem, onUnequipItem, onDropItem]
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <EquipmentSlots
          equipmentSlots={inventory.equipmentSlots}
          isEditable={isEditable}
          activeSlotType={activeSlotType}
          dragItemSlotType={dragItemSlotType}
          onEmptySlotClick={onEmptySlotClick}
        />
        <BackpackGrid
          backpackItems={inventory.backpackItems}
          isEditable={isEditable}
          onItemSelect={onItemSelect}
          selectedItemId={selectedItemId}
        />
        {isEditable && <DropZone />}
        <WeightBar
          currentWeight={inventory.currentWeight}
          maxCapacity={inventory.maxCapacity}
          isEditable={isEditable}
          onMaxCapacityChange={onMaxCapacityChange}
        />
      </div>
    </DndContext>
  );
}
