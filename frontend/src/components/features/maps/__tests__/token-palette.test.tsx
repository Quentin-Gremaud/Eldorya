import { render, screen, fireEvent } from "@testing-library/react";
import { TokenPalette } from "../token-palette";

describe("TokenPalette", () => {
  it("should render token templates", () => {
    render(<TokenPalette />);

    expect(screen.getByText("Tokens")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Player")).toBeInTheDocument();
    expect(screen.getByDisplayValue("NPC")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Monster")).toBeInTheDocument();
  });

  it("should allow editing token labels", () => {
    render(<TokenPalette />);

    const playerInput = screen.getByDisplayValue("Player");
    fireEvent.change(playerInput, { target: { value: "Knight" } });
    expect(screen.getByDisplayValue("Knight")).toBeInTheDocument();
  });

  it("should show drag instruction text", () => {
    render(<TokenPalette />);

    expect(
      screen.getByText("Drag a token onto the map to place it.")
    ).toBeInTheDocument();
  });

  it("should set drag data on drag start", () => {
    render(<TokenPalette />);

    const draggables = document.querySelectorAll("[draggable=true]");
    expect(draggables.length).toBeGreaterThanOrEqual(3);

    const dataStore: Record<string, string> = {};
    const mockDataTransfer = {
      setData: (key: string, value: string) => {
        dataStore[key] = value;
      },
      effectAllowed: "",
    };

    fireEvent.dragStart(draggables[0], { dataTransfer: mockDataTransfer });

    expect(dataStore["tokenType"]).toBe("player");
    expect(dataStore["label"]).toBe("Player");
  });
});
