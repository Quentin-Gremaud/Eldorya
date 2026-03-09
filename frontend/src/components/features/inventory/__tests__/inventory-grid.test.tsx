import { render, screen } from "@testing-library/react";
import { InventoryGrid } from "../inventory-grid";
import type { Inventory } from "@/types/api";

const mockInventory: Inventory = {
  characterId: "char-1",
  campaignId: "campaign-1",
  equipmentSlots: {
    head: null,
    torso: null,
    hands: null,
    legs: null,
    feet: null,
    ring1: null,
    ring2: null,
    weapon_shield: null,
  },
  backpackItems: [
    {
      id: "item-1",
      name: "Iron Sword",
      description: "A simple sword",
      weight: 3,
      slotType: "weapon_shield",
      statModifiers: { strength: 2 },
      position: 0,
    },
  ],
  items: [
    {
      id: "item-1",
      name: "Iron Sword",
      description: "A simple sword",
      weight: 3,
      slotType: "weapon_shield",
      statModifiers: { strength: 2 },
      position: 0,
      equippedSlot: null,
    },
  ],
  currentWeight: 3,
  maxCapacity: 20,
};

const noopHandlers = {
  onEquipItem: jest.fn(),
  onUnequipItem: jest.fn(),
  onMoveItem: jest.fn(),
  onDropItem: jest.fn(),
};

describe("InventoryGrid", () => {
  it("should render equipment slots section", () => {
    render(
      <InventoryGrid
        inventory={mockInventory}
        isEditable={true}
        {...noopHandlers}
      />
    );

    expect(screen.getByText("Equipment")).toBeInTheDocument();
  });

  it("should render backpack section", () => {
    render(
      <InventoryGrid
        inventory={mockInventory}
        isEditable={true}
        {...noopHandlers}
      />
    );

    expect(screen.getByText("Backpack")).toBeInTheDocument();
  });

  it("should render weight bar", () => {
    render(
      <InventoryGrid
        inventory={mockInventory}
        isEditable={true}
        {...noopHandlers}
      />
    );

    expect(screen.getByText("3.0/20.0 kg")).toBeInTheDocument();
  });

  it("should render backpack item names", () => {
    render(
      <InventoryGrid
        inventory={mockInventory}
        isEditable={true}
        {...noopHandlers}
      />
    );

    expect(screen.getByText("Iron Sword")).toBeInTheDocument();
  });

  it("should render all 8 equipment slot labels when empty", () => {
    render(
      <InventoryGrid
        inventory={mockInventory}
        isEditable={true}
        {...noopHandlers}
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
});
