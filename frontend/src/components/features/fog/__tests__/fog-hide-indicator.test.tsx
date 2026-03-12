import { render, screen, act } from "@testing-library/react";
import { FogHideIndicator } from "../fog-hide-indicator";
import type { FogZone } from "@/types/api";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

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

  it("should not render when isTargetedView is false", () => {
    const { container } = render(
      <FogHideIndicator fogZones={[baseFogZone]} isTargetedView={false} />
    );

    expect(container.innerHTML).toBe("");
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
    // Override matchMedia to return reduced-motion
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

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
  });
});
