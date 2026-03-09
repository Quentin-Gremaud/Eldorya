import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddItemDialog } from "../add-item-dialog";

describe("AddItemDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onSubmit: jest.fn(),
    isPending: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render dialog with form fields", () => {
    render(<AddItemDialog {...defaultProps} />);

    expect(screen.getByText("Add Item to Inventory")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Weight")).toBeInTheDocument();
    expect(screen.getByText("Add Item")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("should disable submit button when pending", () => {
    render(<AddItemDialog {...defaultProps} isPending={true} />);

    const submitButton = screen.getByText("Adding...");
    expect(submitButton).toBeInTheDocument();
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);
  });

  it("should call onOpenChange when cancel is clicked", () => {
    render(<AddItemDialog {...defaultProps} />);

    fireEvent.click(screen.getByText("Cancel"));

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should not render when closed", () => {
    render(<AddItemDialog {...defaultProps} open={false} />);

    expect(screen.queryByText("Add Item to Inventory")).not.toBeInTheDocument();
  });
});
