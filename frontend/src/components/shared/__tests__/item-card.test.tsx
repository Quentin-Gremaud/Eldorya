import { render, screen } from "@testing-library/react";
import { ItemCard } from "../item-card";
import type { InventoryItem } from "@/types/api";

const mockItem: InventoryItem = {
  id: "item-1",
  name: "Iron Sword",
  description: "A simple iron sword",
  weight: 3,
  slotType: "weapon_shield",
  statModifiers: { strength: 2 },
  position: 0,
  equippedSlot: null,
};

describe("ItemCard", () => {
  it("should display item name", () => {
    render(<ItemCard item={mockItem} />);

    expect(screen.getByText("Iron Sword")).toBeInTheDocument();
  });

  it("should display item weight", () => {
    render(<ItemCard item={mockItem} />);

    expect(screen.getByText("3kg")).toBeInTheDocument();
  });

  it("should display stat modifiers", () => {
    render(<ItemCard item={mockItem} />);

    expect(screen.getByText("+2 str")).toBeInTheDocument();
  });

  it("should display description in full mode", () => {
    render(<ItemCard item={mockItem} />);

    expect(screen.getByText("A simple iron sword")).toBeInTheDocument();
  });

  it("should render compact variant", () => {
    render(<ItemCard item={mockItem} compact />);

    expect(screen.getByText("Iron Sword")).toBeInTheDocument();
    expect(screen.getByText("3kg")).toBeInTheDocument();
    // Description should not be shown in compact mode
    expect(screen.queryByText("A simple iron sword")).toBeNull();
  });

  it("should not show modifiers when empty", () => {
    const itemNoMods: InventoryItem = {
      ...mockItem,
      statModifiers: {},
    };

    render(<ItemCard item={itemNoMods} />);

    expect(screen.queryByText(/\+/)).toBeNull();
  });
});
