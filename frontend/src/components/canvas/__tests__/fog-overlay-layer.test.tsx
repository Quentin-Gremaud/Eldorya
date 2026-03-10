import { render } from "@testing-library/react";
import { FogOverlayLayer } from "../fog-overlay-layer";
import type { FogZone } from "@/types/api";

const mockLayer = jest.fn();
const mockRect = jest.fn();
const mockGroup = jest.fn();

jest.mock("react-konva", () => ({
  Layer: (props: Record<string, unknown>) => {
    mockLayer(props);
    return <div data-testid="fog-layer">{props.children as React.ReactNode}</div>;
  },
  Rect: (props: Record<string, unknown>) => {
    mockRect(props);
    return <div data-testid="fog-rect" />;
  },
  Group: (props: Record<string, unknown>) => {
    mockGroup(props);
    return <div data-testid="fog-group">{props.children as React.ReactNode}</div>;
  },
}));

const makeFogZone = (overrides: Partial<FogZone> = {}): FogZone => ({
  id: "fz-1",
  mapLevelId: "l1",
  playerId: "p1",
  x: 100,
  y: 200,
  width: 300,
  height: 400,
  revealed: true,
  createdAt: "2026-03-10",
  ...overrides,
});

describe("FogOverlayLayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when fogZones is undefined", () => {
    const { container } = render(
      <FogOverlayLayer fogZones={undefined} stageWidth={800} stageHeight={600} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when fogZones is empty array", () => {
    const { container } = render(
      <FogOverlayLayer fogZones={[]} stageWidth={800} stageHeight={600} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders overlay + revealed holes when fogZones has data", () => {
    const zones: FogZone[] = [
      makeFogZone({ id: "fz-1", revealed: true }),
      makeFogZone({ id: "fz-2", revealed: false, x: 500, y: 500 }),
    ];

    const { getAllByTestId } = render(
      <FogOverlayLayer fogZones={zones} stageWidth={800} stageHeight={600} />
    );

    // Layer should be rendered
    expect(getAllByTestId("fog-layer")).toHaveLength(1);

    // Rects: 1 dark overlay + 1 revealed hole (fz-2 is not revealed, so no hole for it)
    const rectCalls = mockRect.mock.calls;
    expect(rectCalls.length).toBe(2); // overlay + 1 revealed zone

    // First rect is the full overlay
    expect(rectCalls[0][0]).toMatchObject({
      width: 800,
      height: 600,
      fill: "#000",
      opacity: 0.85,
    });

    // Second rect is the revealed zone hole
    expect(rectCalls[1][0]).toMatchObject({
      x: 100,
      y: 200,
      width: 300,
      height: 400,
      globalCompositeOperation: "destination-out",
    });
  });

  it("renders layer with listening={false} for performance", () => {
    const zones: FogZone[] = [makeFogZone()];

    render(
      <FogOverlayLayer fogZones={zones} stageWidth={800} stageHeight={600} />
    );

    expect(mockLayer).toHaveBeenCalledWith(
      expect.objectContaining({ listening: false })
    );
  });
});
