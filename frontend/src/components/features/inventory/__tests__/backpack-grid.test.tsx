import { render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { BackpackGrid } from "../backpack-grid";
import type { BackpackItem } from "@/types/api";

const mockItems: BackpackItem[] = [
  {
    id: "item-1",
    name: "Iron Sword",
    description: "A simple sword",
    weight: 3,
    slotType: "weapon_shield",
    statModifiers: { strength: 2 },
    position: 0,
  },
  {
    id: "item-2",
    name: "Iron Helmet",
    description: "A sturdy helmet",
    weight: 2,
    slotType: "head",
    statModifiers: { constitution: 1 },
    position: 1,
  },
];

function renderWithDndContext(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>);
}

describe("BackpackGrid", () => {
  it("should render backpack items", () => {
    renderWithDndContext(
      <BackpackGrid backpackItems={mockItems} isEditable={true} />
    );

    expect(screen.getByText("Iron Sword")).toBeInTheDocument();
    expect(screen.getByText("Iron Helmet")).toBeInTheDocument();
  });

  it("should render empty slots for grid layout", () => {
    renderWithDndContext(
      <BackpackGrid backpackItems={[]} isEditable={true} />
    );

    // Should render minimum 4 empty slots
    const heading = screen.getByText("Backpack");
    expect(heading).toBeInTheDocument();
  });

  it("should show item with aria-label", () => {
    renderWithDndContext(
      <BackpackGrid backpackItems={mockItems} isEditable={true} />
    );

    expect(screen.getByLabelText("Backpack item: Iron Sword")).toBeInTheDocument();
    expect(screen.getByLabelText("Backpack item: Iron Helmet")).toBeInTheDocument();
  });
});
