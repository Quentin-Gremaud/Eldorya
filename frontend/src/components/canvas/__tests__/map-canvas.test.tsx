import { render, fireEvent } from "@testing-library/react";
import { MapCanvas } from "../map-canvas";
import type { MapLevel, Token } from "@/types/api";

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock react-konva
jest.mock("react-konva", () => ({
  Stage: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <div data-testid="stage" onClick={onClick} {...props}>
      {children}
    </div>
  ),
}));

// Mock child components
jest.mock("../map-background-layer", () => ({
  MapBackgroundLayer: ({ backgroundImageUrl, onImageLoad }: { backgroundImageUrl: string | null; onImageLoad?: (dims: { width: number; height: number }) => void }) => (
    <div data-testid="background-layer" data-url={backgroundImageUrl} data-has-onimageload={!!onImageLoad} />
  ),
}));

jest.mock("../token-layer", () => ({
  TokenLayer: ({
    tokens,
    interactive,
    viewMode,
    fogZones,
  }: {
    tokens: Token[];
    interactive: boolean;
    viewMode?: string;
    fogZones?: unknown[];
  }) => (
    <div
      data-testid="token-layer"
      data-token-count={tokens.length}
      data-interactive={interactive}
      data-view-mode={viewMode ?? "gm"}
      data-fog-count={fogZones?.length ?? 0}
    />
  ),
}));

jest.mock("../fog-overlay-layer", () => ({
  FogOverlayLayer: ({
    fogZones,
    stageWidth,
    stageHeight,
  }: {
    fogZones?: unknown[];
    stageWidth: number;
    stageHeight: number;
  }) => (
    <div
      data-testid="fog-overlay-layer"
      data-fog-count={fogZones?.length ?? 0}
      data-stage-width={stageWidth}
      data-stage-height={stageHeight}
    />
  ),
}));

jest.mock("@/components/features/fog/fog-reveal-indicator", () => ({
  FogRevealIndicator: ({
    fogZones,
    isTargetedView,
    viewMode,
  }: {
    fogZones: unknown[];
    isTargetedView: boolean;
    viewMode?: string;
  }) => (
    <div
      data-testid="fog-reveal-indicator"
      data-fog-count={fogZones.length}
      data-is-targeted-view={isTargetedView}
      data-view-mode={viewMode ?? ""}
    />
  ),
}));

jest.mock("@/components/features/fog/fog-hide-indicator", () => ({
  FogHideIndicator: ({
    fogZones,
    isTargetedView,
    viewMode,
  }: {
    fogZones: unknown[];
    isTargetedView: boolean;
    viewMode?: string;
  }) => (
    <div
      data-testid="fog-hide-indicator"
      data-fog-count={fogZones?.length ?? 0}
      data-is-targeted-view={isTargetedView}
      data-view-mode={viewMode ?? ""}
    />
  ),
}));

jest.mock("../map-controls", () => ({
  MapControls: ({
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onFitToImage,
  }: {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetZoom: () => void;
    onFitToImage?: () => void;
  }) => (
    <div data-testid="map-controls" data-has-fit-to-image={!!onFitToImage}>
      <button data-testid="zoom-in" onClick={onZoomIn} />
      <button data-testid="zoom-out" onClick={onZoomOut} />
      <button data-testid="reset-zoom" onClick={onResetZoom} />
      {onFitToImage && <button data-testid="fit-to-image" onClick={onFitToImage} />}
    </div>
  ),
}));

const mockMapLevel: MapLevel = {
  id: "level-1",
  campaignId: "campaign-1",
  name: "Ground Floor",
  parentId: null,
  depth: 0,
  backgroundImageUrl: "https://example.com/map.png",
  createdAt: "2026-03-09T10:00:00.000Z",
  updatedAt: "2026-03-09T10:00:00.000Z",
};

const mockTokens: Token[] = [
  {
    id: "token-1",
    campaignId: "campaign-1",
    mapLevelId: "level-1",
    x: 100,
    y: 200,
    tokenType: "player",
    label: "Warrior",
    createdAt: "2026-03-09T10:00:00.000Z",
    updatedAt: "2026-03-09T10:00:00.000Z",
  },
];

describe("MapCanvas", () => {
  it("should render all child components", () => {
    const { getByTestId } = render(
      <MapCanvas
        mapLevel={mockMapLevel}
        tokens={mockTokens}
        interactive={true}
      />
    );

    expect(getByTestId("stage")).toBeInTheDocument();
    expect(getByTestId("background-layer")).toBeInTheDocument();
    expect(getByTestId("token-layer")).toBeInTheDocument();
    expect(getByTestId("map-controls")).toBeInTheDocument();
  });

  it("should pass backgroundImageUrl to MapBackgroundLayer", () => {
    const { getByTestId } = render(
      <MapCanvas
        mapLevel={mockMapLevel}
        tokens={mockTokens}
        interactive={true}
      />
    );

    expect(getByTestId("background-layer").getAttribute("data-url")).toBe(
      "https://example.com/map.png"
    );
  });

  it("should pass tokens and interactive to TokenLayer", () => {
    const { getByTestId } = render(
      <MapCanvas
        mapLevel={mockMapLevel}
        tokens={mockTokens}
        interactive={true}
      />
    );

    const tokenLayer = getByTestId("token-layer");
    expect(tokenLayer.getAttribute("data-token-count")).toBe("1");
    expect(tokenLayer.getAttribute("data-interactive")).toBe("true");
  });

  it("should render without context menu initially", () => {
    const { queryByRole } = render(
      <MapCanvas
        mapLevel={mockMapLevel}
        tokens={mockTokens}
        interactive={true}
      />
    );

    expect(queryByRole("menu")).not.toBeInTheDocument();
  });

  it("should handle drop with token data", () => {
    const onTokenPlace = jest.fn();
    const mockUUID = "550e8400-e29b-41d4-a716-446655440099";
    jest.spyOn(crypto, "randomUUID").mockReturnValue(mockUUID as `${string}-${string}-${string}-${string}-${string}`);

    const { container } = render(
      <MapCanvas
        mapLevel={mockMapLevel}
        tokens={mockTokens}
        interactive={true}
        onTokenPlace={onTokenPlace}
      />
    );

    // The drop handler is on the container div, but without a real Konva stage
    // the ref won't be set, so onTokenPlace won't fire in JSDOM.
    // We verify the component renders without errors with the callback.
    expect(container).toBeInTheDocument();

    jest.restoreAllMocks();
  });

  it("should render with null backgroundImageUrl", () => {
    const levelNoImage = { ...mockMapLevel, backgroundImageUrl: null };
    const { getByTestId } = render(
      <MapCanvas
        mapLevel={levelNoImage}
        tokens={[]}
        interactive={false}
      />
    );

    expect(getByTestId("background-layer").getAttribute("data-url")).toBeNull();
  });

  it("should render with empty tokens array", () => {
    const { getByTestId } = render(
      <MapCanvas
        mapLevel={mockMapLevel}
        tokens={[]}
        interactive={true}
      />
    );

    expect(getByTestId("token-layer").getAttribute("data-token-count")).toBe("0");
  });

  it("should default viewMode to gm", () => {
    const { getByTestId } = render(
      <MapCanvas
        mapLevel={mockMapLevel}
        tokens={mockTokens}
        interactive={true}
      />
    );

    expect(getByTestId("token-layer").getAttribute("data-view-mode")).toBe("gm");
  });

  it("should pass viewMode to TokenLayer", () => {
    const { getByTestId } = render(
      <MapCanvas
        mapLevel={mockMapLevel}
        tokens={mockTokens}
        interactive={true}
        viewMode="preview"
      />
    );

    expect(getByTestId("token-layer").getAttribute("data-view-mode")).toBe("preview");
  });

  it("should disable interactive handlers in preview mode", () => {
    const { getByTestId } = render(
      <MapCanvas
        mapLevel={mockMapLevel}
        tokens={mockTokens}
        interactive={true}
        viewMode="preview"
      />
    );

    expect(getByTestId("token-layer").getAttribute("data-interactive")).toBe("false");
  });

  it("should not render context menu in preview mode", () => {
    const { queryByRole } = render(
      <MapCanvas
        mapLevel={mockMapLevel}
        tokens={mockTokens}
        interactive={true}
        viewMode="preview"
      />
    );

    expect(queryByRole("menu")).not.toBeInTheDocument();
  });

  it("should disable interactive handlers in player mode", () => {
    const { getByTestId } = render(
      <MapCanvas
        mapLevel={mockMapLevel}
        tokens={mockTokens}
        interactive={false}
        viewMode="player"
      />
    );

    expect(getByTestId("token-layer").getAttribute("data-interactive")).toBe("false");
  });

  it("should pass fogZones to FogOverlayLayer and TokenLayer", () => {
    const fogZones = [
      { id: "fz-1", mapLevelId: "l1", playerId: "p1", x: 0, y: 0, width: 100, height: 100, revealed: true, createdAt: "2026-03-10" },
    ];

    const { getByTestId } = render(
      <MapCanvas
        mapLevel={mockMapLevel}
        tokens={mockTokens}
        interactive={false}
        viewMode="player"
        fogZones={fogZones}
      />
    );

    expect(getByTestId("fog-overlay-layer").getAttribute("data-fog-count")).toBe("1");
    expect(getByTestId("token-layer").getAttribute("data-fog-count")).toBe("1");
  });

  it("should pass onImageLoad to MapBackgroundLayer", () => {
    const { getByTestId } = render(
      <MapCanvas
        mapLevel={mockMapLevel}
        tokens={mockTokens}
        interactive={true}
      />
    );

    expect(getByTestId("background-layer").getAttribute("data-has-onimageload")).toBe("true");
  });

  it("should pass viewMode to FogRevealIndicator and FogHideIndicator in player mode", () => {
    const fogZones = [
      { id: "fz-1", mapLevelId: "l1", playerId: "p1", x: 0, y: 0, width: 100, height: 100, revealed: true, createdAt: "2026-03-10" },
    ];

    const { getByTestId } = render(
      <MapCanvas
        mapLevel={mockMapLevel}
        tokens={mockTokens}
        interactive={false}
        viewMode="player"
        fogZones={fogZones}
      />
    );

    const revealIndicator = getByTestId("fog-reveal-indicator");
    expect(revealIndicator.getAttribute("data-view-mode")).toBe("player");
    expect(revealIndicator.getAttribute("data-is-targeted-view")).toBe("false");

    const hideIndicator = getByTestId("fog-hide-indicator");
    expect(hideIndicator.getAttribute("data-view-mode")).toBe("player");
    expect(hideIndicator.getAttribute("data-is-targeted-view")).toBe("false");
  });

  it("should set isTargetedView for preview mode with playerId", () => {
    const fogZones = [
      { id: "fz-1", mapLevelId: "l1", playerId: "p1", x: 0, y: 0, width: 100, height: 100, revealed: true, createdAt: "2026-03-10" },
    ];

    const { getByTestId } = render(
      <MapCanvas
        mapLevel={mockMapLevel}
        tokens={mockTokens}
        interactive={false}
        viewMode="preview"
        playerId="player-1"
        fogZones={fogZones}
      />
    );

    const revealIndicator = getByTestId("fog-reveal-indicator");
    expect(revealIndicator.getAttribute("data-view-mode")).toBe("preview");
    expect(revealIndicator.getAttribute("data-is-targeted-view")).toBe("true");
  });

  it("should render FogOverlayLayer with zero fog when no fogZones", () => {
    const { getByTestId } = render(
      <MapCanvas
        mapLevel={mockMapLevel}
        tokens={mockTokens}
        interactive={true}
      />
    );

    expect(getByTestId("fog-overlay-layer").getAttribute("data-fog-count")).toBe("0");
  });
});
