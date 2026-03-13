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

  it("renders full fog when all zones are unrevealed (0 revealed zones)", () => {
    const zones: FogZone[] = [
      makeFogZone({ id: "fz-1", revealed: false }),
      makeFogZone({ id: "fz-2", revealed: false, x: 500 }),
    ];

    render(
      <FogOverlayLayer fogZones={zones} stageWidth={800} stageHeight={600} />
    );

    const rectCalls = mockRect.mock.calls;
    // Only 1 rect: the full overlay. No revealed holes.
    expect(rectCalls.length).toBe(1);
    expect(rectCalls[0][0]).toMatchObject({
      width: 800,
      height: 600,
      fill: "#000",
      opacity: 0.85,
    });
  });

  it("renders N clear holes for N revealed zones", () => {
    const zones: FogZone[] = [
      makeFogZone({ id: "fz-1", revealed: true, x: 0, y: 0, width: 100, height: 100 }),
      makeFogZone({ id: "fz-2", revealed: true, x: 200, y: 200, width: 150, height: 150 }),
      makeFogZone({ id: "fz-3", revealed: true, x: 400, y: 400, width: 50, height: 50 }),
    ];

    render(
      <FogOverlayLayer fogZones={zones} stageWidth={800} stageHeight={600} />
    );

    const rectCalls = mockRect.mock.calls;
    // 1 overlay + 3 revealed holes
    expect(rectCalls.length).toBe(4);

    // Each hole uses destination-out compositing
    for (let i = 1; i <= 3; i++) {
      expect(rectCalls[i][0]).toMatchObject({
        globalCompositeOperation: "destination-out",
      });
    }

    // Verify individual hole positions
    expect(rectCalls[1][0]).toMatchObject({ x: 0, y: 0, width: 100, height: 100 });
    expect(rectCalls[2][0]).toMatchObject({ x: 200, y: 200, width: 150, height: 150 });
    expect(rectCalls[3][0]).toMatchObject({ x: 400, y: 400, width: 50, height: 50 });
  });

  it("renders adjacent revealed zones as separate holes (no gap, no overlap artifact)", () => {
    // Two adjacent zones sharing an edge at x=100
    const zones: FogZone[] = [
      makeFogZone({ id: "fz-1", revealed: true, x: 0, y: 0, width: 100, height: 100 }),
      makeFogZone({ id: "fz-2", revealed: true, x: 100, y: 0, width: 100, height: 100 }),
    ];

    render(
      <FogOverlayLayer fogZones={zones} stageWidth={800} stageHeight={600} />
    );

    const rectCalls = mockRect.mock.calls;
    // 1 overlay + 2 holes
    expect(rectCalls.length).toBe(3);

    // First hole ends at x=100, second starts at x=100 → seamless
    expect(rectCalls[1][0]).toMatchObject({ x: 0, width: 100 });
    expect(rectCalls[2][0]).toMatchObject({ x: 100, width: 100 });

    // Both use destination-out → overlapping edges will just produce continuous clear area
    expect(rectCalls[1][0].globalCompositeOperation).toBe("destination-out");
    expect(rectCalls[2][0].globalCompositeOperation).toBe("destination-out");
  });

  it("uses 0.85 opacity for player viewMode (default)", () => {
    const zones: FogZone[] = [makeFogZone()];

    render(
      <FogOverlayLayer fogZones={zones} stageWidth={800} stageHeight={600} viewMode="player" />
    );

    const overlayRect = mockRect.mock.calls[0][0];
    expect(overlayRect.opacity).toBe(0.85);
  });

  it("uses 0.4 opacity for gm viewMode", () => {
    const zones: FogZone[] = [makeFogZone()];

    render(
      <FogOverlayLayer fogZones={zones} stageWidth={800} stageHeight={600} viewMode="gm" />
    );

    const overlayRect = mockRect.mock.calls[0][0];
    expect(overlayRect.opacity).toBe(0.4);
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
