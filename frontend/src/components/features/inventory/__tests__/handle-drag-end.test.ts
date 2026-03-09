import type { DragEndEvent } from "@dnd-kit/core";
import { processDragEnd, type DragEndHandlers } from "../handle-drag-end";

function makeDragEndEvent(
  activeData: Record<string, unknown> | undefined,
  overData: Record<string, unknown> | undefined,
  hasOver = true
): DragEndEvent {
  return {
    active: {
      id: "active-1",
      data: { current: activeData },
      rect: { current: { initial: null, translated: null } },
    },
    over: hasOver
      ? {
          id: "over-1",
          data: { current: overData },
          rect: { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 },
          disabled: false,
        }
      : null,
    activatorEvent: new Event("pointer"),
    collisions: [],
    delta: { x: 0, y: 0 },
  } as unknown as DragEndEvent;
}

describe("processDragEnd", () => {
  let handlers: DragEndHandlers;

  beforeEach(() => {
    handlers = {
      onEquipItem: jest.fn(),
      onUnequipItem: jest.fn(),
      onMoveItem: jest.fn(),
      onDropItem: jest.fn(),
    };
  });

  it("should call onEquipItem when dragging backpack item to matching equipment slot", () => {
    const event = makeDragEndEvent(
      {
        type: "backpack",
        item: {
          id: "item-1",
          name: "Iron Sword",
          slotType: "weapon_shield",
          position: 0,
          weight: 3,
          description: "A sword",
          statModifiers: {},
        },
      },
      { type: "equipment", slotType: "weapon_shield" }
    );

    processDragEnd(event, handlers);

    expect(handlers.onEquipItem).toHaveBeenCalledWith(
      "item-1",
      "weapon_shield"
    );
  });

  it("should NOT call onEquipItem when slot type does not match item", () => {
    const event = makeDragEndEvent(
      {
        type: "backpack",
        item: {
          id: "item-1",
          name: "Iron Sword",
          slotType: "weapon_shield",
          position: 0,
          weight: 3,
          description: "A sword",
          statModifiers: {},
        },
      },
      { type: "equipment", slotType: "head" }
    );

    processDragEnd(event, handlers);

    expect(handlers.onEquipItem).not.toHaveBeenCalled();
  });

  it("should call onMoveItem when dragging backpack item to different backpack position", () => {
    const event = makeDragEndEvent(
      {
        type: "backpack",
        item: {
          id: "item-1",
          name: "Iron Sword",
          slotType: "weapon_shield",
          position: 0,
          weight: 3,
          description: "A sword",
          statModifiers: {},
        },
      },
      { type: "backpack-slot", position: 3 }
    );

    processDragEnd(event, handlers);

    expect(handlers.onMoveItem).toHaveBeenCalledWith("item-1", 3);
  });

  it("should NOT call onMoveItem when dragging to the same position", () => {
    const event = makeDragEndEvent(
      {
        type: "backpack",
        item: {
          id: "item-1",
          name: "Iron Sword",
          slotType: "weapon_shield",
          position: 0,
          weight: 3,
          description: "A sword",
          statModifiers: {},
        },
      },
      { type: "backpack-slot", position: 0 }
    );

    processDragEnd(event, handlers);

    expect(handlers.onMoveItem).not.toHaveBeenCalled();
  });

  it("should call onUnequipItem when dragging equipment item to backpack slot", () => {
    const event = makeDragEndEvent(
      {
        type: "equipment",
        item: {
          id: "item-1",
          name: "Iron Sword",
          slotType: "weapon_shield",
          position: null,
          weight: 3,
          description: "A sword",
          statModifiers: {},
        },
        slotType: "weapon_shield",
      },
      { type: "backpack-slot", position: 0 }
    );

    processDragEnd(event, handlers);

    expect(handlers.onUnequipItem).toHaveBeenCalledWith("item-1");
  });

  it("should call onDropItem when dragging item to drop zone", () => {
    const event = makeDragEndEvent(
      {
        type: "backpack",
        item: {
          id: "item-1",
          name: "Iron Sword",
          slotType: "weapon_shield",
          position: 0,
          weight: 3,
          description: "A sword",
          statModifiers: {},
        },
      },
      { type: "drop-zone" }
    );

    processDragEnd(event, handlers);

    expect(handlers.onDropItem).toHaveBeenCalledWith("item-1");
  });

  it("should do nothing when there is no drop target", () => {
    const event = makeDragEndEvent(
      {
        type: "backpack",
        item: { id: "item-1" },
      },
      undefined,
      false
    );

    processDragEnd(event, handlers);

    expect(handlers.onEquipItem).not.toHaveBeenCalled();
    expect(handlers.onUnequipItem).not.toHaveBeenCalled();
    expect(handlers.onMoveItem).not.toHaveBeenCalled();
    expect(handlers.onDropItem).not.toHaveBeenCalled();
  });

  it("should do nothing when active data is missing", () => {
    const event = makeDragEndEvent(undefined, { type: "equipment", slotType: "head" });

    processDragEnd(event, handlers);

    expect(handlers.onEquipItem).not.toHaveBeenCalled();
  });
});
