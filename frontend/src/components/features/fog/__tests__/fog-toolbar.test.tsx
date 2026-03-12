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

  it("should render the fog reveal all button", () => {
    render(<FogToolbar activeTool="select" onToolChange={jest.fn()} />);

    expect(screen.getByTestId("fog-reveal-all-button")).toBeInTheDocument();
    expect(screen.getByText("Reveal to All")).toBeInTheDocument();
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

  it("should call onToolChange with fog-reveal-all when Reveal to All button clicked", () => {
    const onToolChange = jest.fn();
    render(<FogToolbar activeTool="select" onToolChange={onToolChange} />);

    fireEvent.click(screen.getByTestId("fog-reveal-all-button"));

    expect(onToolChange).toHaveBeenCalledWith("fog-reveal-all");
  });

  it("should call onToolChange with select when Reveal to All clicked while fog-reveal-all is active", () => {
    const onToolChange = jest.fn();
    render(<FogToolbar activeTool="fog-reveal-all" onToolChange={onToolChange} />);

    fireEvent.click(screen.getByTestId("fog-reveal-all-button"));

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

  it("should toggle fog-reveal-all on keyboard shortcut G", () => {
    const onToolChange = jest.fn();
    render(<FogToolbar activeTool="select" onToolChange={onToolChange} />);

    fireEvent.keyDown(document, { key: "g" });

    expect(onToolChange).toHaveBeenCalledWith("fog-reveal-all");
  });

  it("should toggle back to select on keyboard shortcut G when fog-reveal-all is active", () => {
    const onToolChange = jest.fn();
    render(<FogToolbar activeTool="fog-reveal-all" onToolChange={onToolChange} />);

    fireEvent.keyDown(document, { key: "g" });

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

  it("should not toggle on G when inside an input element", () => {
    const onToolChange = jest.fn();
    render(
      <>
        <FogToolbar activeTool="select" onToolChange={onToolChange} />
        <input data-testid="text-input" />
      </>
    );

    const input = screen.getByTestId("text-input");
    fireEvent.keyDown(input, { key: "g" });

    expect(onToolChange).not.toHaveBeenCalled();
  });

  it("should show active visual feedback when fog-reveal is active", () => {
    render(<FogToolbar activeTool="fog-reveal" onToolChange={jest.fn()} />);

    const button = screen.getByTestId("fog-reveal-button");
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("should show active visual feedback when fog-reveal-all is active", () => {
    render(<FogToolbar activeTool="fog-reveal-all" onToolChange={jest.fn()} />);

    const button = screen.getByTestId("fog-reveal-all-button");
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("should show inactive state when select is active", () => {
    render(<FogToolbar activeTool="select" onToolChange={jest.fn()} />);

    const button = screen.getByTestId("fog-reveal-button");
    expect(button.getAttribute("aria-pressed")).toBe("false");
    const allButton = screen.getByTestId("fog-reveal-all-button");
    expect(allButton.getAttribute("aria-pressed")).toBe("false");
  });

  it("tools are mutually exclusive - fog-reveal active means fog-reveal-all inactive", () => {
    render(<FogToolbar activeTool="fog-reveal" onToolChange={jest.fn()} />);

    expect(screen.getByTestId("fog-reveal-button").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("fog-reveal-all-button").getAttribute("aria-pressed")).toBe("false");
  });

  it("tools are mutually exclusive - fog-reveal-all active means fog-reveal inactive", () => {
    render(<FogToolbar activeTool="fog-reveal-all" onToolChange={jest.fn()} />);

    expect(screen.getByTestId("fog-reveal-all-button").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("fog-reveal-button").getAttribute("aria-pressed")).toBe("false");
  });

  // Hide tool tests

  it("should render the fog hide button", () => {
    render(<FogToolbar activeTool="select" onToolChange={jest.fn()} />);

    expect(screen.getByTestId("fog-hide-button")).toBeInTheDocument();
    expect(screen.getByText("Fog Hide")).toBeInTheDocument();
  });

  it("should render the fog hide all button", () => {
    render(<FogToolbar activeTool="select" onToolChange={jest.fn()} />);

    expect(screen.getByTestId("fog-hide-all-button")).toBeInTheDocument();
    expect(screen.getByText("Hide from All")).toBeInTheDocument();
  });

  it("should call onToolChange with fog-hide when clicked", () => {
    const onToolChange = jest.fn();
    render(<FogToolbar activeTool="select" onToolChange={onToolChange} />);

    fireEvent.click(screen.getByTestId("fog-hide-button"));

    expect(onToolChange).toHaveBeenCalledWith("fog-hide");
  });

  it("should call onToolChange with select when fog-hide clicked while active", () => {
    const onToolChange = jest.fn();
    render(<FogToolbar activeTool="fog-hide" onToolChange={onToolChange} />);

    fireEvent.click(screen.getByTestId("fog-hide-button"));

    expect(onToolChange).toHaveBeenCalledWith("select");
  });

  it("should call onToolChange with fog-hide-all when Hide from All button clicked", () => {
    const onToolChange = jest.fn();
    render(<FogToolbar activeTool="select" onToolChange={onToolChange} />);

    fireEvent.click(screen.getByTestId("fog-hide-all-button"));

    expect(onToolChange).toHaveBeenCalledWith("fog-hide-all");
  });

  it("should toggle fog-hide on keyboard shortcut H", () => {
    const onToolChange = jest.fn();
    render(<FogToolbar activeTool="select" onToolChange={onToolChange} />);

    fireEvent.keyDown(document, { key: "h" });

    expect(onToolChange).toHaveBeenCalledWith("fog-hide");
  });

  it("should toggle back to select on keyboard shortcut H when fog-hide is active", () => {
    const onToolChange = jest.fn();
    render(<FogToolbar activeTool="fog-hide" onToolChange={onToolChange} />);

    fireEvent.keyDown(document, { key: "h" });

    expect(onToolChange).toHaveBeenCalledWith("select");
  });

  it("should toggle fog-hide-all on keyboard shortcut J", () => {
    const onToolChange = jest.fn();
    render(<FogToolbar activeTool="select" onToolChange={onToolChange} />);

    fireEvent.keyDown(document, { key: "j" });

    expect(onToolChange).toHaveBeenCalledWith("fog-hide-all");
  });

  it("should toggle back to select on keyboard shortcut J when fog-hide-all is active", () => {
    const onToolChange = jest.fn();
    render(<FogToolbar activeTool="fog-hide-all" onToolChange={onToolChange} />);

    fireEvent.keyDown(document, { key: "j" });

    expect(onToolChange).toHaveBeenCalledWith("select");
  });

  it("should show active visual feedback when fog-hide is active", () => {
    render(<FogToolbar activeTool="fog-hide" onToolChange={jest.fn()} />);

    const button = screen.getByTestId("fog-hide-button");
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("should show active visual feedback when fog-hide-all is active", () => {
    render(<FogToolbar activeTool="fog-hide-all" onToolChange={jest.fn()} />);

    const button = screen.getByTestId("fog-hide-all-button");
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("should not toggle on H when inside an input element", () => {
    const onToolChange = jest.fn();
    render(
      <>
        <FogToolbar activeTool="select" onToolChange={onToolChange} />
        <input data-testid="text-input" />
      </>
    );

    const input = screen.getByTestId("text-input");
    fireEvent.keyDown(input, { key: "h" });

    expect(onToolChange).not.toHaveBeenCalled();
  });
});
