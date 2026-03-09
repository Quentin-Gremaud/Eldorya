import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MapHierarchyTree } from "../map-hierarchy-tree";
import type { MapLevel } from "@/types/api";

const mockLevels: MapLevel[] = [
  { id: "l1", campaignId: "c1", name: "World", parentId: null, depth: 0, backgroundImageUrl: null, createdAt: "2026-03-08", updatedAt: "2026-03-08" },
  { id: "l2", campaignId: "c1", name: "Continent", parentId: "l1", depth: 1, backgroundImageUrl: null, createdAt: "2026-03-08", updatedAt: "2026-03-08" },
  { id: "l3", campaignId: "c1", name: "City", parentId: "l2", depth: 2, backgroundImageUrl: null, createdAt: "2026-03-08", updatedAt: "2026-03-08" },
];

describe("MapHierarchyTree", () => {
  const defaultProps = {
    levels: mockLevels,
    selectedId: null,
    onSelect: jest.fn(),
    onRename: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render tree with all levels", () => {
    render(<MapHierarchyTree {...defaultProps} />);

    expect(screen.getByText("World")).toBeInTheDocument();
    expect(screen.getByText("Continent")).toBeInTheDocument();
    expect(screen.getByText("City")).toBeInTheDocument();
  });

  it("should render empty state when no levels", () => {
    render(<MapHierarchyTree {...defaultProps} levels={[]} />);

    expect(screen.getByText("No map levels yet.")).toBeInTheDocument();
  });

  it("should call onSelect when level is clicked", async () => {
    const user = userEvent.setup();
    render(<MapHierarchyTree {...defaultProps} />);

    await user.click(screen.getByText("World"));

    expect(defaultProps.onSelect).toHaveBeenCalledWith("l1");
  });

  it("should render tree role for accessibility", () => {
    render(<MapHierarchyTree {...defaultProps} />);

    expect(screen.getByRole("tree")).toBeInTheDocument();
  });
});
