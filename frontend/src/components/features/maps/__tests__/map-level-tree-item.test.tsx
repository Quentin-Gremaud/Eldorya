import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MapLevelTreeItem } from "../map-level-tree-item";
import type { MapLevel } from "@/types/api";

const makeLevel = (overrides: Partial<MapLevel> = {}): MapLevel => ({
  id: "l1",
  campaignId: "c1",
  name: "World",
  parentId: null,
  depth: 0,
  backgroundImageUrl: null,
  createdAt: "2026-03-08",
  updatedAt: "2026-03-08",
  ...overrides,
});

describe("MapLevelTreeItem", () => {
  const defaultProps = {
    level: makeLevel(),
    children: [] as MapLevel[],
    allLevels: [makeLevel()],
    selectedId: null,
    onSelect: jest.fn(),
    onRename: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render level name", () => {
    render(<MapLevelTreeItem {...defaultProps} />);

    expect(screen.getByText("World")).toBeInTheDocument();
  });

  it("should call onSelect when clicked", async () => {
    const user = userEvent.setup();
    render(<MapLevelTreeItem {...defaultProps} />);

    await user.click(screen.getByText("World"));

    expect(defaultProps.onSelect).toHaveBeenCalledWith("l1");
  });

  it("should show expand/collapse when has children", () => {
    const child = makeLevel({ id: "l2", name: "Region", parentId: "l1", depth: 1 });
    render(
      <MapLevelTreeItem
        {...defaultProps}
        children={[child]}
        allLevels={[makeLevel(), child]}
      />
    );

    expect(screen.getByLabelText("Collapse")).toBeInTheDocument();
  });

  it("should render children nested levels", () => {
    const child = makeLevel({ id: "l2", name: "Region", parentId: "l1", depth: 1 });
    render(
      <MapLevelTreeItem
        {...defaultProps}
        children={[child]}
        allLevels={[makeLevel(), child]}
      />
    );

    expect(screen.getByText("Region")).toBeInTheDocument();
  });
});
