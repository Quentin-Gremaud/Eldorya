import { render, screen, act } from "@testing-library/react";
import { FogRevealIndicator } from "../fog-reveal-indicator";
import type { FogZone } from "@/types/api";

// Mock usePrefersReducedMotion hook
jest.mock("@/hooks/use-prefers-reduced-motion", () => ({
  usePrefersReducedMotion: jest.fn(() => false),
}));

// Mock react-konva
jest.mock("react-konva", () => ({
  Rect: (props: Record<string, unknown>) => (
    <div
      data-testid={props["data-testid"] ?? `rect-${props.key ?? "unknown"}`}
      data-x={props.x}
      data-y={props.y}
      data-width={props.width}
      data-height={props.height}
      data-stroke={props.stroke}
    />
  ),
}));

const baseFogZone: FogZone = {
  id: "zone-1",
  mapLevelId: "map-1",
  playerId: "player-1",
  x: 10,
  y: 20,
  width: 100,
  height: 200,
  revealed: true,
  createdAt: "2026-03-11T10:00:00.000Z",
};

describe("FogRevealIndicator", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should not render when isTargetedView is false and no viewMode", () => {
    const { container } = render(
      <FogRevealIndicator fogZones={[baseFogZone]} isTargetedView={false} />
    );

    expect(container.innerHTML).toBe("");
  });

  it("should not animate in gm viewMode", () => {
    const { rerender } = render(
      <FogRevealIndicator fogZones={[]} isTargetedView={false} viewMode="gm" />
    );

    rerender(
      <FogRevealIndicator fogZones={[baseFogZone]} isTargetedView={false} viewMode="gm" />
    );

    expect(
      screen.queryByTestId(`fog-reveal-glow-${baseFogZone.id}`)
    ).not.toBeInTheDocument();
  });

  it("should animate in player viewMode", () => {
    const { rerender } = render(
      <FogRevealIndicator fogZones={[]} isTargetedView={false} viewMode="player" />
    );

    rerender(
      <FogRevealIndicator fogZones={[baseFogZone]} isTargetedView={false} viewMode="player" />
    );

    expect(
      screen.getByTestId(`fog-reveal-glow-${baseFogZone.id}`)
    ).toBeInTheDocument();
  });

  it("should animate in preview viewMode with isTargetedView", () => {
    const { rerender } = render(
      <FogRevealIndicator fogZones={[]} isTargetedView={true} viewMode="preview" />
    );

    rerender(
      <FogRevealIndicator fogZones={[baseFogZone]} isTargetedView={true} viewMode="preview" />
    );

    expect(
      screen.getByTestId(`fog-reveal-glow-${baseFogZone.id}`)
    ).toBeInTheDocument();
  });

  it("should not render glow when no new zones are added", () => {
    const { container } = render(
      <FogRevealIndicator fogZones={[]} isTargetedView={true} />
    );

    // No fog zones, no glow rects
    expect(container.querySelectorAll("[data-testid]")).toHaveLength(0);
  });

  it("should render glow rect for newly added zones", () => {
    const { rerender } = render(
      <FogRevealIndicator fogZones={[]} isTargetedView={true} />
    );

    rerender(
      <FogRevealIndicator fogZones={[baseFogZone]} isTargetedView={true} />
    );

    expect(
      screen.getByTestId(`fog-reveal-glow-${baseFogZone.id}`)
    ).toBeInTheDocument();
  });

  it("should remove glow after animation duration (2s)", () => {
    const { rerender } = render(
      <FogRevealIndicator fogZones={[]} isTargetedView={true} />
    );

    rerender(
      <FogRevealIndicator fogZones={[baseFogZone]} isTargetedView={true} />
    );

    expect(
      screen.getByTestId(`fog-reveal-glow-${baseFogZone.id}`)
    ).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(
      screen.queryByTestId(`fog-reveal-glow-${baseFogZone.id}`)
    ).not.toBeInTheDocument();
  });

  it("should handle multiple zones added at once", () => {
    const zone2: FogZone = { ...baseFogZone, id: "zone-2", x: 50 };

    const { rerender } = render(
      <FogRevealIndicator fogZones={[]} isTargetedView={true} />
    );

    rerender(
      <FogRevealIndicator
        fogZones={[baseFogZone, zone2]}
        isTargetedView={true}
      />
    );

    expect(
      screen.getByTestId(`fog-reveal-glow-${baseFogZone.id}`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`fog-reveal-glow-${zone2.id}`)
    ).toBeInTheDocument();
  });

  it("should not animate existing zones on re-render", () => {
    const { rerender } = render(
      <FogRevealIndicator fogZones={[baseFogZone]} isTargetedView={true} />
    );

    // Wait for initial animation to end
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const zone2: FogZone = { ...baseFogZone, id: "zone-2", x: 50 };

    rerender(
      <FogRevealIndicator
        fogZones={[baseFogZone, zone2]}
        isTargetedView={true}
      />
    );

    // Only zone2 should glow (new), not baseFogZone (already existed)
    expect(
      screen.queryByTestId(`fog-reveal-glow-${baseFogZone.id}`)
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId(`fog-reveal-glow-${zone2.id}`)
    ).toBeInTheDocument();
  });

  it("should clear all glow rects when zones are added in rapid succession", () => {
    const zone2: FogZone = { ...baseFogZone, id: "zone-2", x: 50 };

    const { rerender } = render(
      <FogRevealIndicator fogZones={[]} isTargetedView={true} />
    );

    // Add zone-1
    rerender(
      <FogRevealIndicator fogZones={[baseFogZone]} isTargetedView={true} />
    );

    expect(
      screen.getByTestId(`fog-reveal-glow-${baseFogZone.id}`)
    ).toBeInTheDocument();

    // Rapidly add zone-2 before zone-1's timer fires (within 2s)
    rerender(
      <FogRevealIndicator
        fogZones={[baseFogZone, zone2]}
        isTargetedView={true}
      />
    );

    // Both should be glowing
    expect(
      screen.getByTestId(`fog-reveal-glow-${baseFogZone.id}`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`fog-reveal-glow-${zone2.id}`)
    ).toBeInTheDocument();

    // After 2s, BOTH glows should be cleared (not just zone-2)
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(
      screen.queryByTestId(`fog-reveal-glow-${baseFogZone.id}`)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`fog-reveal-glow-${zone2.id}`)
    ).not.toBeInTheDocument();
  });
});
