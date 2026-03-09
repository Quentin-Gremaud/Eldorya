import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateMapLevelDialog } from "../create-map-level-dialog";
import type { MapLevel } from "@/types/api";

const mockLevels: MapLevel[] = [
  { id: "l1", campaignId: "c1", name: "World", parentId: null, depth: 0, backgroundImageUrl: null, createdAt: "2026-03-08", updatedAt: "2026-03-08" },
];

describe("CreateMapLevelDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onSubmit: jest.fn(),
    isPending: false,
    levels: mockLevels,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render dialog with form fields", () => {
    render(<CreateMapLevelDialog {...defaultProps} />);

    expect(screen.getByText("Create Map Level")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByText("Parent Level (optional)")).toBeInTheDocument();
    expect(screen.getByText("Create Level")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("should disable submit button when pending", () => {
    render(<CreateMapLevelDialog {...defaultProps} isPending={true} />);

    const submitButton = screen.getByText("Creating...");
    expect(submitButton).toBeInTheDocument();
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);
  });

  it("should not render when closed", () => {
    render(<CreateMapLevelDialog {...defaultProps} open={false} />);

    expect(screen.queryByText("Create Map Level")).not.toBeInTheDocument();
  });

  it("should show validation error for empty name", async () => {
    render(<CreateMapLevelDialog {...defaultProps} />);

    fireEvent.click(screen.getByText("Create Level"));

    await waitFor(() => {
      expect(screen.getByText("Name is required.")).toBeInTheDocument();
    });
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("should call onSubmit with correct data", async () => {
    render(<CreateMapLevelDialog {...defaultProps} />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "New Region" },
    });
    fireEvent.click(screen.getByText("Create Level"));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        name: "New Region",
        parentId: undefined,
      });
    });
  });

  it("should render select trigger with placeholder", () => {
    render(<CreateMapLevelDialog {...defaultProps} />);

    expect(screen.getAllByText("None (root level)").length).toBeGreaterThan(0);
  });
});
