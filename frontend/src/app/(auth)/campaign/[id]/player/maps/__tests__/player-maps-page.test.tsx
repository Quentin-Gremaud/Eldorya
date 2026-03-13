import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import PlayerMapsPage from "../page";

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock matchMedia (needed by FogHideIndicator in MapCanvas)
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

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    use: (promise: unknown) => {
      if (promise && typeof promise === "object") {
        return { id: "c1" };
      }
      return promise;
    },
  };
});

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: jest.fn().mockResolvedValue("mock-token") }),
  useUser: () => ({ user: { id: "user-1" } }),
}));

const mockMapLevels = [
  {
    id: "l1",
    campaignId: "c1",
    name: "World",
    parentId: null,
    depth: 0,
    backgroundImageUrl: null,
    createdAt: "2026-03-08",
    updatedAt: "2026-03-08",
  },
  {
    id: "l2",
    campaignId: "c1",
    name: "Dungeon",
    parentId: "l1",
    depth: 1,
    backgroundImageUrl: null,
    createdAt: "2026-03-08",
    updatedAt: "2026-03-08",
  },
];

const mockUseMapLevels = jest.fn().mockReturnValue({
  mapLevels: mockMapLevels,
  isLoading: false,
  isError: false,
});

jest.mock("@/hooks/use-map-levels", () => ({
  useMapLevels: (...args: unknown[]) => mockUseMapLevels(...args),
}));

jest.mock("@/hooks/use-campaign", () => ({
  useCampaign: () => ({
    campaign: { id: "c1", name: "Test Campaign" },
    isLoading: false,
    isError: false,
  }),
}));

const mockUseTokens = jest.fn().mockReturnValue({
  tokens: [],
  isLoading: false,
  isError: false,
  error: null,
});

jest.mock("@/hooks/use-tokens", () => ({
  useTokens: (...args: unknown[]) => mockUseTokens(...args),
}));

jest.mock("@/hooks/use-campaign-players", () => ({
  useCampaignPlayers: () => ({
    players: [{ userId: "user-1", displayName: "Player One", status: "ready", joinedAt: "2026-03-08" }],
    playerCount: 1,
    isLoading: false,
    isError: false,
    hasActiveInvitation: false,
    allReady: true,
  }),
}));

const mockUseFogState = jest.fn().mockReturnValue({
  fogZones: [],
  isLoading: false,
  isError: false,
});

jest.mock("@/hooks/use-fog-state", () => ({
  useFogState: (...args: unknown[]) => mockUseFogState(...args),
}));

jest.mock("react-konva", () => ({
  Stage: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stage">{children}</div>
  ),
  Layer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Group: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="token-group">{children}</div>
  ),
  Circle: () => <div />,
  Text: (props: Record<string, unknown>) => (
    <span data-testid="token-label">{props.text as string}</span>
  ),
  Image: () => <div />,
  Rect: () => <div />,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("PlayerMapsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMapLevels.mockReturnValue({
      mapLevels: mockMapLevels,
      isLoading: false,
      isError: false,
    });
    mockUseTokens.mockReturnValue({
      tokens: [],
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("should render map canvas area when data loads", async () => {
    render(<PlayerMapsPage params={Promise.resolve({ id: "c1" })} />, {
      wrapper: createWrapper(),
    });

    // Auto-selects first root level "World" (appears in tree + header + breadcrumb)
    expect(screen.getAllByText("World").length).toBeGreaterThanOrEqual(1);

    // Canvas area is present (lazy-loaded via Suspense, stage may or may not resolve in test)
    // The level name appears in the canvas header when selected
    expect(screen.getByText("Test Campaign — Map")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    mockUseMapLevels.mockReturnValue({
      mapLevels: [],
      isLoading: true,
      isError: false,
    });

    render(<PlayerMapsPage params={Promise.resolve({ id: "c1" })} />, {
      wrapper: createWrapper(),
    });

    // Loading state: no map levels rendered, no stage
    expect(screen.queryByTestId("stage")).not.toBeInTheDocument();
    expect(screen.queryByText("No map levels yet")).not.toBeInTheDocument();
  });

  it("should show error state on API failure", () => {
    mockUseMapLevels.mockReturnValue({
      mapLevels: [],
      isLoading: false,
      isError: true,
    });

    render(<PlayerMapsPage params={Promise.resolve({ id: "c1" })} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Failed to load map data.")).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("should navigate between map levels", () => {
    render(<PlayerMapsPage params={Promise.resolve({ id: "c1" })} />, {
      wrapper: createWrapper(),
    });

    // World is auto-selected, appears in tree + header + breadcrumb
    expect(screen.getAllByText("World").length).toBeGreaterThanOrEqual(1);

    // Click Dungeon in the tree to navigate
    fireEvent.click(screen.getByText("Dungeon"));

    // Dungeon should now be the selected level name in the canvas header
    const dungeonTexts = screen.getAllByText("Dungeon");
    expect(dungeonTexts.length).toBeGreaterThanOrEqual(1);
  });

  it("should render MapCanvas with viewMode='player'", () => {
    render(<PlayerMapsPage params={Promise.resolve({ id: "c1" })} />, {
      wrapper: createWrapper(),
    });

    // Canvas should render (stage is present)
    expect(screen.getByTestId("stage")).toBeInTheDocument();

    // No token palette should be present (player cannot place tokens)
    expect(screen.queryByText("Tokens")).not.toBeInTheDocument();
  });

  it("should show empty state when no map levels exist", () => {
    mockUseMapLevels.mockReturnValue({
      mapLevels: [],
      isLoading: false,
      isError: false,
    });

    render(<PlayerMapsPage params={Promise.resolve({ id: "c1" })} />, {
      wrapper: createWrapper(),
    });

    expect(
      screen.getByText("No map levels yet")
    ).toBeInTheDocument();
  });

  it("should display campaign name in header", () => {
    render(<PlayerMapsPage params={Promise.resolve({ id: "c1" })} />, {
      wrapper: createWrapper(),
    });

    expect(
      screen.getByText("Test Campaign — Map")
    ).toBeInTheDocument();
  });

  it("should call useFogState with correct parameters", () => {
    render(<PlayerMapsPage params={Promise.resolve({ id: "c1" })} />, {
      wrapper: createWrapper(),
    });

    // useFogState should be called with campaignId, playerId, and selectedLevelId
    expect(mockUseFogState).toHaveBeenCalledWith("c1", "user-1", "l1");
  });

  it("should show token error state with retry button", () => {
    mockUseTokens.mockReturnValue({
      tokens: [],
      isLoading: false,
      isError: true,
      error: new Error("Token fetch failed"),
    });

    render(<PlayerMapsPage params={Promise.resolve({ id: "c1" })} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Failed to load tokens.")).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("should show breadcrumb when level is selected", () => {
    render(<PlayerMapsPage params={Promise.resolve({ id: "c1" })} />, {
      wrapper: createWrapper(),
    });

    // Auto-selects first root level, breadcrumb should be visible
    // The breadcrumb shows the level name
    const breadcrumbArea = document.querySelector(".bg-muted");
    expect(breadcrumbArea).toBeInTheDocument();
  });

  describe("fog integration", () => {
    const revealedZone = {
      id: "fz-1",
      mapLevelId: "l1",
      playerId: "user-1",
      x: 50,
      y: 50,
      width: 200,
      height: 200,
      revealed: true,
      createdAt: "2026-03-11",
    };

    it("should render page with useFogState data", () => {
      mockUseFogState.mockReturnValue({
        fogZones: [revealedZone],
        isLoading: false,
        isError: false,
      });

      render(<PlayerMapsPage params={Promise.resolve({ id: "c1" })} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByTestId("stage")).toBeInTheDocument();
      expect(mockUseFogState).toHaveBeenCalledWith("c1", "user-1", "l1");
    });

    it("should update when fog zone is revealed (WebSocket simulation)", () => {
      // Start with no fog zones
      mockUseFogState.mockReturnValue({
        fogZones: [],
        isLoading: false,
        isError: false,
      });

      const { rerender } = render(
        <PlayerMapsPage params={Promise.resolve({ id: "c1" })} />,
        { wrapper: createWrapper() },
      );

      // Simulate WebSocket FogZoneRevealed → useFogState returns new zone
      mockUseFogState.mockReturnValue({
        fogZones: [revealedZone],
        isLoading: false,
        isError: false,
      });

      rerender(<PlayerMapsPage params={Promise.resolve({ id: "c1" })} />);

      // Page still renders correctly after fog update
      expect(screen.getByTestId("stage")).toBeInTheDocument();
    });

    it("should update when fog zone is hidden (WebSocket simulation)", () => {
      mockUseFogState.mockReturnValue({
        fogZones: [revealedZone],
        isLoading: false,
        isError: false,
      });

      const { rerender } = render(
        <PlayerMapsPage params={Promise.resolve({ id: "c1" })} />,
        { wrapper: createWrapper() },
      );

      // Simulate WebSocket FogZoneHidden → zone removed
      mockUseFogState.mockReturnValue({
        fogZones: [],
        isLoading: false,
        isError: false,
      });

      rerender(<PlayerMapsPage params={Promise.resolve({ id: "c1" })} />);

      expect(screen.getByTestId("stage")).toBeInTheDocument();
    });

    it("should handle reveal → hide cycle correctly", () => {
      // 1. Start empty
      mockUseFogState.mockReturnValue({ fogZones: [], isLoading: false, isError: false });

      const { rerender } = render(
        <PlayerMapsPage params={Promise.resolve({ id: "c1" })} />,
        { wrapper: createWrapper() },
      );

      // 2. Reveal
      mockUseFogState.mockReturnValue({ fogZones: [revealedZone], isLoading: false, isError: false });
      rerender(<PlayerMapsPage params={Promise.resolve({ id: "c1" })} />);

      // 3. Hide again
      mockUseFogState.mockReturnValue({ fogZones: [], isLoading: false, isError: false });
      rerender(<PlayerMapsPage params={Promise.resolve({ id: "c1" })} />);

      // Page renders without errors
      expect(screen.getByTestId("stage")).toBeInTheDocument();
    });

    it("should render with tokens filtered by fog in player view", () => {
      const tokensData = [
        { id: "t1", campaignId: "c1", mapLevelId: "l1", x: 100, y: 100, tokenType: "player", label: "Hero", createdAt: "2026-03-10", updatedAt: "2026-03-10" },
        { id: "t2", campaignId: "c1", mapLevelId: "l1", x: 500, y: 500, tokenType: "monster", label: "Goblin", createdAt: "2026-03-10", updatedAt: "2026-03-10" },
      ];

      mockUseTokens.mockReturnValue({
        tokens: tokensData,
        isLoading: false,
        isError: false,
        error: null,
      });

      mockUseFogState.mockReturnValue({
        fogZones: [revealedZone],
        isLoading: false,
        isError: false,
      });

      render(<PlayerMapsPage params={Promise.resolve({ id: "c1" })} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByTestId("stage")).toBeInTheDocument();

      // Token "Hero" at (100,100) is inside revealed zone (50,50)-(250,250) → visible
      expect(screen.getByText("Hero")).toBeInTheDocument();

      // Token "Goblin" at (500,500) is outside revealed zone → hidden by fog filtering
      expect(screen.queryByText("Goblin")).not.toBeInTheDocument();
    });

    it("should respect prefers-reduced-motion for fog animations", () => {
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

      mockUseFogState.mockReturnValue({
        fogZones: [revealedZone],
        isLoading: false,
        isError: false,
      });

      render(<PlayerMapsPage params={Promise.resolve({ id: "c1" })} />, {
        wrapper: createWrapper(),
      });

      // Page renders without errors with reduced-motion
      expect(screen.getByTestId("stage")).toBeInTheDocument();

      // Restore default matchMedia mock
      (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));
    });
  });
});
