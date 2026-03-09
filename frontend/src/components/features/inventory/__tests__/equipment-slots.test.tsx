import { render, screen, fireEvent } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { EquipmentSlots } from "../equipment-slots";
import type { EquipmentSlotType, InventoryItem } from "@/types/api";

const emptySlots: Record<EquipmentSlotType, InventoryItem | null> = {
  head: null,
  torso: null,
  hands: null,
  legs: null,
  feet: null,
  ring1: null,
  ring2: null,
  weapon_shield: null,
};

const swordItem = {
  id: "item-sword",
  name: "Iron Sword",
  description: "A simple iron sword",
  weight: 3,
  slotType: "weapon_shield",
  statModifiers: { strength: 2 },
  position: null,
  equippedSlot: "weapon_shield",
};

function renderWithDndContext(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>);
}

describe("EquipmentSlots", () => {
  it("should render 8 equipment slots", () => {
    renderWithDndContext(
      <EquipmentSlots
        equipmentSlots={emptySlots}
        isEditable={true}
      />
    );

    expect(screen.getByText("Head")).toBeInTheDocument();
    expect(screen.getByText("Torso")).toBeInTheDocument();
    expect(screen.getByText("Hands")).toBeInTheDocument();
    expect(screen.getByText("Legs")).toBeInTheDocument();
    expect(screen.getByText("Feet")).toBeInTheDocument();
    expect(screen.getByText("Ring 1")).toBeInTheDocument();
    expect(screen.getByText("Ring 2")).toBeInTheDocument();
    expect(screen.getByText("Weapon")).toBeInTheDocument();
  });

  it("should show slot labels for empty slots", () => {
    renderWithDndContext(
      <EquipmentSlots
        equipmentSlots={emptySlots}
        isEditable={true}
      />
    );

    const emptySlotLabels = screen.getAllByText(
      /Head|Torso|Hands|Legs|Feet|Ring 1|Ring 2|Weapon/
    );
    expect(emptySlotLabels.length).toBe(8);
  });

  it("should display item when slot is filled", () => {
    const filledSlots = { ...emptySlots, weapon_shield: swordItem };

    renderWithDndContext(
      <EquipmentSlots
        equipmentSlots={filledSlots}
        isEditable={true}
      />
    );

    expect(screen.getByText("Iron Sword")).toBeInTheDocument();
  });

  it("should render with aria-label for accessibility", () => {
    renderWithDndContext(
      <EquipmentSlots
        equipmentSlots={emptySlots}
        isEditable={true}
      />
    );

    expect(screen.getByLabelText("Head slot (empty)")).toBeInTheDocument();
    expect(screen.getByLabelText("Weapon slot (empty)")).toBeInTheDocument();
  });

  it("should call onEmptySlotClick when clicking an empty slot", () => {
    const onEmptySlotClick = jest.fn();

    renderWithDndContext(
      <EquipmentSlots
        equipmentSlots={emptySlots}
        isEditable={true}
        onEmptySlotClick={onEmptySlotClick}
      />
    );

    fireEvent.click(screen.getByLabelText("Add item to Head slot"));
    expect(onEmptySlotClick).toHaveBeenCalledWith("head");

    fireEvent.click(screen.getByLabelText("Add item to Weapon slot"));
    expect(onEmptySlotClick).toHaveBeenCalledWith("weapon_shield");
  });

  it("should not call onEmptySlotClick when not editable", () => {
    const onEmptySlotClick = jest.fn();

    renderWithDndContext(
      <EquipmentSlots
        equipmentSlots={emptySlots}
        isEditable={false}
        onEmptySlotClick={onEmptySlotClick}
      />
    );

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it("should not render click button for filled slots", () => {
    const filledSlots = { ...emptySlots, weapon_shield: swordItem };
    const onEmptySlotClick = jest.fn();

    renderWithDndContext(
      <EquipmentSlots
        equipmentSlots={filledSlots}
        isEditable={true}
        onEmptySlotClick={onEmptySlotClick}
      />
    );

    expect(screen.queryByLabelText("Add item to Weapon slot")).toBeNull();
    expect(screen.getByLabelText("Add item to Head slot")).toBeInTheDocument();
  });
});
