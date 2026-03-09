import { render, screen, fireEvent } from "@testing-library/react";
import { WeightBar } from "../weight-bar";

describe("WeightBar", () => {
  it("should render current weight and max capacity", () => {
    render(<WeightBar currentWeight={12} maxCapacity={20} />);

    expect(screen.getByText("12.0/20.0 kg")).toBeInTheDocument();
  });

  it("should show normal state when under capacity", () => {
    render(<WeightBar currentWeight={10} maxCapacity={20} />);

    expect(screen.queryByText(/overencumbered/i)).toBeNull();
  });

  it("should not be overencumbered at exactly max capacity", () => {
    render(<WeightBar currentWeight={20} maxCapacity={20} />);

    expect(screen.queryByText(/overencumbered/i)).toBeNull();
  });

  it("should show overencumbered warning when over capacity", () => {
    render(<WeightBar currentWeight={21} maxCapacity={20} />);

    expect(screen.getByText(/overencumbered/i)).toBeInTheDocument();
  });

  it("should show red state at 1 unit over capacity", () => {
    render(<WeightBar currentWeight={21} maxCapacity={20} />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
  });

  it("should have proper aria attributes on progress bar", () => {
    render(<WeightBar currentWeight={12} maxCapacity={20} />);

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toBeInTheDocument();
    expect(progressbar.getAttribute("aria-valuenow")).toBe("12");
    expect(progressbar.getAttribute("aria-valuemax")).toBe("20");
  });

  it("should show edit button when isEditable is true", () => {
    const onMaxCapacityChange = jest.fn();
    render(
      <WeightBar
        currentWeight={12}
        maxCapacity={20}
        isEditable={true}
        onMaxCapacityChange={onMaxCapacityChange}
      />
    );

    expect(screen.getByLabelText("Edit max capacity")).toBeInTheDocument();
  });

  it("should not show edit button when isEditable is false", () => {
    render(<WeightBar currentWeight={12} maxCapacity={20} isEditable={false} />);

    expect(screen.queryByLabelText("Edit max capacity")).toBeNull();
  });

  it("should show input when edit button is clicked", () => {
    const onMaxCapacityChange = jest.fn();
    render(
      <WeightBar
        currentWeight={12}
        maxCapacity={20}
        isEditable={true}
        onMaxCapacityChange={onMaxCapacityChange}
      />
    );

    fireEvent.click(screen.getByLabelText("Edit max capacity"));

    expect(screen.getByLabelText("Max capacity")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm max capacity")).toBeInTheDocument();
    expect(screen.getByLabelText("Cancel editing")).toBeInTheDocument();
  });

  it("should call onMaxCapacityChange when confirmed", () => {
    const onMaxCapacityChange = jest.fn();
    render(
      <WeightBar
        currentWeight={12}
        maxCapacity={20}
        isEditable={true}
        onMaxCapacityChange={onMaxCapacityChange}
      />
    );

    fireEvent.click(screen.getByLabelText("Edit max capacity"));
    fireEvent.change(screen.getByLabelText("Max capacity"), {
      target: { value: "30" },
    });
    fireEvent.click(screen.getByLabelText("Confirm max capacity"));

    expect(onMaxCapacityChange).toHaveBeenCalledWith(30);
  });

  it("should cancel editing without calling onMaxCapacityChange", () => {
    const onMaxCapacityChange = jest.fn();
    render(
      <WeightBar
        currentWeight={12}
        maxCapacity={20}
        isEditable={true}
        onMaxCapacityChange={onMaxCapacityChange}
      />
    );

    fireEvent.click(screen.getByLabelText("Edit max capacity"));
    fireEvent.change(screen.getByLabelText("Max capacity"), {
      target: { value: "30" },
    });
    fireEvent.click(screen.getByLabelText("Cancel editing"));

    expect(onMaxCapacityChange).not.toHaveBeenCalled();
    expect(screen.getByText("12.0/20.0 kg")).toBeInTheDocument();
  });
});
