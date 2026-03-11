import { render, screen, act } from "@testing-library/react";
import { FogPainter } from "../fog-painter";

// Store captured event handlers from the Layer mock
let capturedHandlers: {
  onMouseDown?: (e: unknown) => void;
  onMouseMove?: (e: unknown) => void;
  onMouseUp?: (e: unknown) => void;
} = {};

// Mock Konva stage for pointer/scale simulation
function createMockKonvaEvent(pointerX: number, pointerY: number, scale = 1, stageX = 0, stageY = 0) {
  return {
    target: {
      getStage: () => ({
        getPointerPosition: () => ({ x: pointerX, y: pointerY }),
        scaleX: () => scale,
        position: () => ({ x: stageX, y: stageY }),
      }),
    },
  };
}

// Mock react-konva
jest.mock("react-konva", () => ({
  Layer: ({
    children,
    listening,
    onMouseDown,
    onMouseMove,
    onMouseUp,
  }: {
    children: React.ReactNode;
    listening?: boolean;
    onMouseDown?: (e: unknown) => void;
    onMouseMove?: (e: unknown) => void;
    onMouseUp?: (e: unknown) => void;
  }) => {
    capturedHandlers = { onMouseDown, onMouseMove, onMouseUp };
    return (
      <div
        data-testid="fog-painter-layer"
        data-listening={listening}
        data-has-mousedown={!!onMouseDown}
        data-has-mousemove={!!onMouseMove}
        data-has-mouseup={!!onMouseUp}
      >
        {children}
      </div>
    );
  },
  Rect: (props: Record<string, unknown>) => (
    <div
      data-testid={props["data-testid"] ?? "rect"}
      data-x={props.x}
      data-y={props.y}
      data-width={props.width}
      data-height={props.height}
      data-fill={props.fill}
      data-listening={props.listening}
    />
  ),
}));

describe("FogPainter", () => {
  beforeEach(() => {
    capturedHandlers = {};
  });

  it("should not render when not active", () => {
    const { container } = render(
      <FogPainter active={false} onFogPaint={jest.fn()} />
    );

    expect(container.innerHTML).toBe("");
  });

  it("should render the layer when active", () => {
    render(<FogPainter active={true} onFogPaint={jest.fn()} />);

    expect(screen.getByTestId("fog-painter-layer")).toBeInTheDocument();
  });

  it("should have mouse event handlers when active", () => {
    render(<FogPainter active={true} onFogPaint={jest.fn()} />);

    const layer = screen.getByTestId("fog-painter-layer");
    expect(layer.getAttribute("data-has-mousedown")).toBe("true");
    expect(layer.getAttribute("data-has-mousemove")).toBe("true");
    expect(layer.getAttribute("data-has-mouseup")).toBe("true");
  });

  it("should set listening to true when active", () => {
    render(<FogPainter active={true} onFogPaint={jest.fn()} />);

    const layer = screen.getByTestId("fog-painter-layer");
    expect(layer.getAttribute("data-listening")).toBe("true");
  });

  it("should render an invisible capture rect", () => {
    render(<FogPainter active={true} onFogPaint={jest.fn()} />);

    const rects = screen.getAllByTestId("rect");
    const captureRect = rects.find(
      (r) => r.getAttribute("data-fill") === "transparent"
    );
    expect(captureRect).toBeTruthy();
    expect(captureRect!.getAttribute("data-listening")).toBe("true");
  });

  it("should call onFogPaint with correct coordinates after full draw cycle", () => {
    const onFogPaint = jest.fn();
    render(<FogPainter active={true} onFogPaint={onFogPaint} />);

    act(() => {
      capturedHandlers.onMouseDown?.(createMockKonvaEvent(10, 20));
    });

    act(() => {
      capturedHandlers.onMouseMove?.(createMockKonvaEvent(110, 120));
    });

    act(() => {
      capturedHandlers.onMouseUp?.({});
    });

    expect(onFogPaint).toHaveBeenCalledWith({
      x: 10,
      y: 20,
      width: 100,
      height: 100,
    });
  });

  it("should account for stage scale in coordinate calculation", () => {
    const onFogPaint = jest.fn();
    render(<FogPainter active={true} onFogPaint={onFogPaint} />);

    // Scale = 2, so pointer (20, 40) maps to map coords (10, 20)
    act(() => {
      capturedHandlers.onMouseDown?.(createMockKonvaEvent(20, 40, 2));
    });

    // Pointer (220, 240) maps to map coords (110, 120)
    act(() => {
      capturedHandlers.onMouseMove?.(createMockKonvaEvent(220, 240, 2));
    });

    act(() => {
      capturedHandlers.onMouseUp?.({});
    });

    expect(onFogPaint).toHaveBeenCalledWith({
      x: 10,
      y: 20,
      width: 100,
      height: 100,
    });
  });

  it("should NOT call onFogPaint when zone is too small (< 5px)", () => {
    const onFogPaint = jest.fn();
    render(<FogPainter active={true} onFogPaint={onFogPaint} />);

    act(() => {
      capturedHandlers.onMouseDown?.(createMockKonvaEvent(10, 20));
    });

    act(() => {
      capturedHandlers.onMouseMove?.(createMockKonvaEvent(13, 23));
    });

    act(() => {
      capturedHandlers.onMouseUp?.({});
    });

    expect(onFogPaint).not.toHaveBeenCalled();
  });

  it("should handle reverse drag (bottom-right to top-left)", () => {
    const onFogPaint = jest.fn();
    render(<FogPainter active={true} onFogPaint={onFogPaint} />);

    act(() => {
      capturedHandlers.onMouseDown?.(createMockKonvaEvent(200, 200));
    });

    act(() => {
      capturedHandlers.onMouseMove?.(createMockKonvaEvent(100, 100));
    });

    act(() => {
      capturedHandlers.onMouseUp?.({});
    });

    expect(onFogPaint).toHaveBeenCalledWith({
      x: 100,
      y: 100,
      width: 100,
      height: 100,
    });
  });

  it("should show draft preview rectangle during drag", () => {
    render(<FogPainter active={true} onFogPaint={jest.fn()} />);

    expect(screen.queryByTestId("fog-draft-rect")).not.toBeInTheDocument();

    act(() => {
      capturedHandlers.onMouseDown?.(createMockKonvaEvent(10, 20));
    });

    act(() => {
      capturedHandlers.onMouseMove?.(createMockKonvaEvent(110, 120));
    });

    const draftRect = screen.getByTestId("fog-draft-rect");
    expect(draftRect).toBeInTheDocument();
    expect(draftRect.getAttribute("data-x")).toBe("10");
    expect(draftRect.getAttribute("data-y")).toBe("20");
    expect(draftRect.getAttribute("data-width")).toBe("100");
    expect(draftRect.getAttribute("data-height")).toBe("100");
  });

  it("should clear draft rectangle after mouseup", () => {
    render(<FogPainter active={true} onFogPaint={jest.fn()} />);

    act(() => {
      capturedHandlers.onMouseDown?.(createMockKonvaEvent(10, 20));
    });

    act(() => {
      capturedHandlers.onMouseMove?.(createMockKonvaEvent(110, 120));
    });

    expect(screen.getByTestId("fog-draft-rect")).toBeInTheDocument();

    act(() => {
      capturedHandlers.onMouseUp?.({});
    });

    expect(screen.queryByTestId("fog-draft-rect")).not.toBeInTheDocument();
  });
});
