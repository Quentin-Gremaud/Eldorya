import { render, screen, fireEvent } from "@testing-library/react";
import { LocationLinkDialog } from "../location-link-dialog";
import type { MapLevel } from "@/types/api";

const mockMapLevels: MapLevel[] = [
  {
    id: "level-1",
    campaignId: "campaign-1",
    name: "World Map",
    parentId: null,
    depth: 0,
    backgroundImageUrl: null,
    createdAt: "2026-03-10",
    updatedAt: "2026-03-10",
  },
  {
    id: "level-2",
    campaignId: "campaign-1",
    name: "Forest",
    parentId: "level-1",
    depth: 0,
    backgroundImageUrl: null,
    createdAt: "2026-03-10",
    updatedAt: "2026-03-10",
  },
  {
    id: "level-3",
    campaignId: "campaign-1",
    name: "Cave",
    parentId: "level-1",
    depth: 1,
    backgroundImageUrl: null,
    createdAt: "2026-03-10",
    updatedAt: "2026-03-10",
  },
  {
    id: "level-4",
    campaignId: "campaign-1",
    name: "Village",
    parentId: null,
    depth: 1,
    backgroundImageUrl: null,
    createdAt: "2026-03-10",
    updatedAt: "2026-03-10",
  },
];

describe("LocationLinkDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    mapLevels: mockMapLevels,
    currentMapLevelId: "level-1",
    onSelect: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render dialog title and description", () => {
    render(<LocationLinkDialog {...defaultProps} />);

    expect(
      screen.getByText("Select Destination Map Level")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Choose the map level this location token links to/)
    ).toBeInTheDocument();
  });

  it("should show child levels first when they exist", () => {
    render(<LocationLinkDialog {...defaultProps} />);

    expect(screen.getByText("Child Levels")).toBeInTheDocument();
    expect(screen.getByText("Forest")).toBeInTheDocument();
    expect(screen.getByText("Cave")).toBeInTheDocument();
  });

  it("should show other levels section when child levels exist", () => {
    render(<LocationLinkDialog {...defaultProps} />);

    expect(screen.getByText("Other Levels")).toBeInTheDocument();
    // Village appears as both button text and path text
    expect(screen.getAllByText("Village").length).toBeGreaterThanOrEqual(1);
  });

  it("should show all levels when no child levels exist", () => {
    render(
      <LocationLinkDialog {...defaultProps} currentMapLevelId="level-2" />
    );

    // No children of level-2, so all other levels shown (names may appear multiple times due to path formatting)
    expect(screen.getAllByText("World Map").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Cave/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Village/).length).toBeGreaterThanOrEqual(1);
  });

  it("should call onSelect when a level is selected and confirm clicked", () => {
    render(<LocationLinkDialog {...defaultProps} />);

    fireEvent.click(screen.getByText("Forest"));
    fireEvent.click(screen.getByText("Link Destination"));

    expect(defaultProps.onSelect).toHaveBeenCalledWith("level-2");
  });

  it("should disable confirm button when no level is selected", () => {
    render(<LocationLinkDialog {...defaultProps} />);

    expect(screen.getByText("Link Destination")).toBeDisabled();
  });

  it("should call onCancel when cancel button clicked", () => {
    render(<LocationLinkDialog {...defaultProps} />);

    fireEvent.click(screen.getByText("Cancel"));

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it("should pre-select initialDestinationId", () => {
    render(
      <LocationLinkDialog {...defaultProps} initialDestinationId="level-3" />
    );

    // Confirm button should be enabled because a level is pre-selected
    expect(screen.getByText("Link Destination")).not.toBeDisabled();
  });

  it("should show empty state when no other map levels exist", () => {
    render(
      <LocationLinkDialog
        {...defaultProps}
        mapLevels={[mockMapLevels[0]]}
        currentMapLevelId="level-1"
      />
    );

    expect(
      screen.getByText("No other map levels available. Create a child level first.")
    ).toBeInTheDocument();
  });
});
