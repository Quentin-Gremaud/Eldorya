import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MapBreadcrumb } from "../map-breadcrumb";
import type { MapLevel } from "@/types/api";

const mockLevels: MapLevel[] = [
  { id: "l1", campaignId: "c1", name: "World", parentId: null, depth: 0, backgroundImageUrl: null, createdAt: "2026-03-08", updatedAt: "2026-03-08" },
  { id: "l2", campaignId: "c1", name: "Continent", parentId: "l1", depth: 1, backgroundImageUrl: null, createdAt: "2026-03-08", updatedAt: "2026-03-08" },
  { id: "l3", campaignId: "c1", name: "City", parentId: "l2", depth: 2, backgroundImageUrl: null, createdAt: "2026-03-08", updatedAt: "2026-03-08" },
];

describe("MapBreadcrumb", () => {
  const defaultProps = {
    levels: mockLevels,
    selectedId: "l3",
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render full path from root to selected level", () => {
    render(<MapBreadcrumb {...defaultProps} />);

    expect(screen.getByText("World")).toBeInTheDocument();
    expect(screen.getByText("Continent")).toBeInTheDocument();
    expect(screen.getByText("City")).toBeInTheDocument();
  });

  it("should render nothing when no selectedId", () => {
    const { container } = render(
      <MapBreadcrumb {...defaultProps} selectedId={null} />
    );

    expect(container.innerHTML).toBe("");
  });

  it("should call onSelect when breadcrumb item is clicked", async () => {
    const user = userEvent.setup();
    render(<MapBreadcrumb {...defaultProps} />);

    await user.click(screen.getByText("Continent"));

    expect(defaultProps.onSelect).toHaveBeenCalledWith("l2");
  });

  it("should render single item for root level selection", () => {
    render(<MapBreadcrumb {...defaultProps} selectedId="l1" />);

    expect(screen.getByText("World")).toBeInTheDocument();
    expect(screen.queryByText("Continent")).not.toBeInTheDocument();
  });

  it("should render breadcrumb navigation landmark", () => {
    render(<MapBreadcrumb {...defaultProps} />);

    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
