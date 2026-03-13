import { render, screen, act } from "@testing-library/react";
import { FogHideIndicator } from "../fog-hide-indicator";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
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
      data-fill={props.fill}
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

describe("FogHideIndicator", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should not render when isTargetedView is false and no viewMode", () => {
    const { container } = render(
      <FogHideIndicator fogZones={[baseFogZone]} isTargetedView={false} />
    );

    expect(container.innerHTML).toBe("");
  });

  it("should not animate in gm viewMode", () => {
    const { rerender } = render(
      <FogHideIndicator fogZones={[baseFogZone]} isTargetedView={false} viewMode="gm" />
    );

    rerender(
      <FogHideIndicator fogZones={[]} isTargetedView={false} viewMode="gm" />
    );

    expect(
      screen.queryByTestId(`fog-hide-fade-${baseFogZone.id}`)
    ).not.toBeInTheDocument();
  });

  it("should animate in player viewMode", () => {
    const { rerender } = render(
      <FogHideIndicator fogZones={[baseFogZone]} isTargetedView={false} viewMode="player" />
    );

    rerender(
      <FogHideIndicator fogZones={[]} isTargetedView={false} viewMode="player" />
    );

    expect(
      screen.getByTestId(`fog-hide-fade-${baseFogZone.id}`)
    ).toBeInTheDocument();
  });

  it("should animate in preview viewMode with isTargetedView", () => {
    const { rerender } = render(
      <FogHideIndicator fogZones={[baseFogZone]} isTargetedView={true} viewMode="preview" />
    );

    rerender(
      <FogHideIndicator fogZones={[]} isTargetedView={true} viewMode="preview" />
    );

    expect(
      screen.getByTestId(`fog-hide-fade-${baseFogZone.id}`)
    ).toBeInTheDocument();
  });

  it("should not render fade when no zones are removed", () => {
    const { container } = render(
      <FogHideIndicator fogZones={[baseFogZone]} isTargetedView={true} />
    );

    expect(container.querySelectorAll("[data-testid]")).toHaveLength(0);
  });

  it("should render fade rect when a zone is removed", () => {
    const { rerender } = render(
      <FogHideIndicator fogZones={[baseFogZone]} isTargetedView={true} />
    );

    rerender(
      <FogHideIndicator fogZones={[]} isTargetedView={true} />
    );

    expect(
      screen.getByTestId(`fog-hide-fade-${baseFogZone.id}`)
    ).toBeInTheDocument();
  });

  it("should remove fade after animation duration (1s)", () => {
    const { rerender } = render(
      <FogHideIndicator fogZones={[baseFogZone]} isTargetedView={true} />
    );

    rerender(
      <FogHideIndicator fogZones={[]} isTargetedView={true} />
    );

    expect(
      screen.getByTestId(`fog-hide-fade-${baseFogZone.id}`)
    ).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(
      screen.queryByTestId(`fog-hide-fade-${baseFogZone.id}`)
    ).not.toBeInTheDocument();
  });

  it("should handle multiple zones removed at once", () => {
    const zone2: FogZone = { ...baseFogZone, id: "zone-2", x: 50 };

    const { rerender } = render(
      <FogHideIndicator fogZones={[baseFogZone, zone2]} isTargetedView={true} />
    );

    rerender(
      <FogHideIndicator fogZones={[]} isTargetedView={true} />
    );

    expect(
      screen.getByTestId(`fog-hide-fade-${baseFogZone.id}`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`fog-hide-fade-${zone2.id}`)
    ).toBeInTheDocument();
  });

  it("should not show fade for zones that were never present", () => {
    const { container } = render(
      <FogHideIndicator fogZones={[]} isTargetedView={true} />
    );

    expect(container.querySelectorAll("[data-testid]")).toHaveLength(0);
  });

  it("should skip animation when prefers-reduced-motion is enabled", () => {
    (usePrefersReducedMotion as jest.Mock).mockReturnValue(true);

    const { rerender } = render(
      <FogHideIndicator fogZones={[baseFogZone]} isTargetedView={true} />
    );

    rerender(
      <FogHideIndicator fogZones={[]} isTargetedView={true} />
    );

    // With reduced-motion, no fade overlay should be shown
    expect(
      screen.queryByTestId(`fog-hide-fade-${baseFogZone.id}`)
    ).not.toBeInTheDocument();

    (usePrefersReducedMotion as jest.Mock).mockReturnValue(false);
  });

  it("should clear all fade rects when zones are removed in rapid succession", () => {
    const zone2: FogZone = { ...baseFogZone, id: "zone-2", x: 50 };

    const { rerender } = render(
      <FogHideIndicator fogZones={[baseFogZone, zone2]} isTargetedView={true} />
    );

    // Remove zone-1 first
    rerender(
      <FogHideIndicator fogZones={[zone2]} isTargetedView={true} />
    );

    expect(
      screen.getByTestId(`fog-hide-fade-${baseFogZone.id}`)
    ).toBeInTheDocument();

    // Rapidly remove zone-2 before zone-1's timer fires (within 1s)
    rerender(
      <FogHideIndicator fogZones={[]} isTargetedView={true} />
    );

    // Both should be showing fade
    expect(
      screen.getByTestId(`fog-hide-fade-${baseFogZone.id}`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`fog-hide-fade-${zone2.id}`)
    ).toBeInTheDocument();

    // After 1s, BOTH fades should be cleared (not just zone-2)
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(
      screen.queryByTestId(`fog-hide-fade-${baseFogZone.id}`)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`fog-hide-fade-${zone2.id}`)
    ).not.toBeInTheDocument();
  });
});
