import type { DragEndEvent } from "@dnd-kit/core";
import type { BackpackItem, EquipmentSlotType } from "@/types/api";

export interface DragEndHandlers {
  onEquipItem: (itemId: string, slotType: string) => void;
  onUnequipItem: (itemId: string) => void;
  onMoveItem: (itemId: string, toPosition: number) => void;
  onDropItem: (itemId: string) => void;
}

export function processDragEnd(
  event: DragEndEvent,
  handlers: DragEndHandlers
): void {
  const { active, over } = event;
  if (!over) return;

  const activeData = active.data.current;
  const overData = over.data.current;

  if (!activeData || !overData) return;

  // Drag from backpack to equipment slot
  if (activeData.type === "backpack" && overData.type === "equipment") {
    const item = activeData.item as BackpackItem;
    const slotType = overData.slotType as EquipmentSlotType;

    if (item.slotType === slotType) {
      handlers.onEquipItem(item.id, slotType);
    }
    return;
  }

  // Drag from backpack to backpack (reorder)
  if (activeData.type === "backpack" && overData.type === "backpack-slot") {
    const item = activeData.item as BackpackItem;
    const toPosition = overData.position as number;

    if (item.position !== toPosition) {
      handlers.onMoveItem(item.id, toPosition);
    }
    return;
  }

  // Drag from equipment to backpack (unequip)
  if (activeData.type === "equipment" && overData.type === "backpack-slot") {
    const item = activeData.item as BackpackItem;
    if (item) {
      handlers.onUnequipItem(item.id);
    }
    return;
  }

  // Drag to drop zone (discard item)
  if (overData.type === "drop-zone") {
    const item = activeData.item as BackpackItem;
    if (item) {
      handlers.onDropItem(item.id);
    }
    return;
  }
}
