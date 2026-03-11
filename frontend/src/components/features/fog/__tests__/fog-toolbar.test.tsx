import { render, screen, fireEvent } from "@testing-library/react";
import { FogToolbar } from "../fog-toolbar";

// Mock shadcn tooltip (to avoid radix portal issues in tests)
jest.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

describe("FogToolbar", () => {
  it("should render the fog reveal button", () => {
    render(<FogToolbar activeTool="select" onToolChange={jest.fn()} />);

    expect(screen.getByTestId("fog-reveal-button")).toBeInTheDocument();
    expect(screen.getByText("Fog Reveal")).toBeInTheDocument();
  });

  it("should call onToolChange with fog-reveal when clicked while select is active", () => {
    const onToolChange = jest.fn();
    render(<FogToolbar activeTool="select" onToolChange={onToolChange} />);

    fireEvent.click(screen.getByTestId("fog-reveal-button"));

    expect(onToolChange).toHaveBeenCalledWith("fog-reveal");
  });

  it("should call onToolChange with select when clicked while fog-reveal is active", () => {
    const onToolChange = jest.fn();
    render(<FogToolbar activeTool="fog-reveal" onToolChange={onToolChange} />);

    fireEvent.click(screen.getByTestId("fog-reveal-button"));

    expect(onToolChange).toHaveBeenCalledWith("select");
  });

  it("should toggle tool on keyboard shortcut F", () => {
    const onToolChange = jest.fn();
    render(<FogToolbar activeTool="select" onToolChange={onToolChange} />);

    fireEvent.keyDown(document, { key: "f" });

    expect(onToolChange).toHaveBeenCalledWith("fog-reveal");
  });

  it("should toggle back to select on keyboard shortcut F when fog-reveal is active", () => {
    const onToolChange = jest.fn();
    render(<FogToolbar activeTool="fog-reveal" onToolChange={onToolChange} />);

    fireEvent.keyDown(document, { key: "f" });

    expect(onToolChange).toHaveBeenCalledWith("select");
  });

  it("should not toggle on F when inside an input element", () => {
    const onToolChange = jest.fn();
    render(
      <>
        <FogToolbar activeTool="select" onToolChange={onToolChange} />
        <input data-testid="text-input" />
      </>
    );

    const input = screen.getByTestId("text-input");
    fireEvent.keyDown(input, { key: "f" });

    expect(onToolChange).not.toHaveBeenCalled();
  });

  it("should show active visual feedback when fog-reveal is active", () => {
    render(<FogToolbar activeTool="fog-reveal" onToolChange={jest.fn()} />);

    const button = screen.getByTestId("fog-reveal-button");
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("should show inactive state when select is active", () => {
    render(<FogToolbar activeTool="select" onToolChange={jest.fn()} />);

    const button = screen.getByTestId("fog-reveal-button");
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });
});
