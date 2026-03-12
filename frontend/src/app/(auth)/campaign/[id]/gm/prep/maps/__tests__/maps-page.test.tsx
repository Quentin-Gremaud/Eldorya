import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createElement } from "react";
import GmPrepMapsPage from "../page";

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

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

const mockMapLevels = [
  { id: "l1", campaignId: "c1", name: "World", parentId: null, depth: 0, backgroundImageUrl: null, createdAt: "2026-03-08", updatedAt: "2026-03-08" },
];

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: jest.fn().mockResolvedValue("mock-token") }),
}));

jest.mock("@/hooks/use-campaign", () => ({
  useCampaign: () => ({
    campaign: { name: "Test Campaign" },
    isLoading: false,
    isError: false,
  }),
}));

jest.mock("@/hooks/use-map-levels", () => ({
  useMapLevels: () => ({
    mapLevels: mockMapLevels,
    isLoading: false,
    isError: false,
  }),
}));

jest.mock("@/hooks/use-create-map-level", () => ({
  useCreateMapLevel: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

jest.mock("@/hooks/use-rename-map-level", () => ({
  useRenameMapLevel: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

jest.mock("@/hooks/use-tokens", () => ({
  useTokens: () => ({
    tokens: [],
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

jest.mock("@/hooks/use-place-token", () => ({
  usePlaceToken: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

jest.mock("@/hooks/use-move-token", () => ({
  useMoveToken: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

jest.mock("@/hooks/use-remove-token", () => ({
  useRemoveToken: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

const mockPlayers = [
  { userId: "p1", displayName: "Alice", status: "ready" as const, joinedAt: "2026-03-08" },
  { userId: "p2", displayName: "Bob", status: "joined" as const, joinedAt: "2026-03-08" },
];

jest.mock("@/hooks/use-campaign-players", () => ({
  useCampaignPlayers: () => ({
    players: mockPlayers,
    playerCount: 2,
    isLoading: false,
    isError: false,
    hasActiveInvitation: false,
    allReady: false,
  }),
}));

const mockRevealMutate = jest.fn();
const mockRevealAllMutate = jest.fn();

jest.mock("@/hooks/use-reveal-fog-zone", () => ({
  useRevealFogZone: () => ({
    mutate: mockRevealMutate,
    isPending: false,
  }),
}));

jest.mock("@/hooks/use-reveal-fog-zone-to-all", () => ({
  useRevealFogZoneToAll: () => ({
    mutate: mockRevealAllMutate,
    isPending: false,
  }),
}));

jest.mock("@/hooks/use-fog-state", () => ({
  useFogState: () => ({
    fogZones: [],
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

jest.mock("react-konva", () => ({
  Stage: ({ children }: { children: React.ReactNode }) => <div data-testid="stage">{children}</div>,
  Layer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Group: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Circle: () => <div />,
  Text: () => <div />,
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
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(TooltipProvider, null, children)
    );
  };
}

describe("GmPrepMapsPage", () => {
  it("should render the map hierarchy page", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Map Hierarchy")).toBeInTheDocument();
    expect(screen.getByText("Create Map Level")).toBeInTheDocument();
  });

  it("should render map levels from the tree", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("World")).toBeInTheDocument();
  });

  it("should show canvas placeholder when no level selected", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Select a map level")).toBeInTheDocument();
  });

  it("should render preview player view button when players exist", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    // Select a map level first to show the canvas area
    fireEvent.click(screen.getByText("World"));

    expect(screen.getByRole("button", { name: /preview.*player.*view/i })).toBeInTheDocument();
  });

  it("should enter preview mode when preview button clicked", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("World"));
    fireEvent.click(screen.getByRole("button", { name: /preview.*player.*view/i }));

    expect(screen.getByText(/previewing as/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /exit preview/i })).toBeInTheDocument();
  });

  it("should exit preview mode when exit button clicked", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("World"));
    fireEvent.click(screen.getByRole("button", { name: /preview.*player.*view/i }));
    expect(screen.getByText(/previewing as/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /exit preview/i }));
    expect(screen.queryByText(/previewing as/i)).not.toBeInTheDocument();
  });

  it("should exit preview mode when Escape key pressed", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("World"));
    fireEvent.click(screen.getByRole("button", { name: /preview.*player.*view/i }));
    expect(screen.getByText(/previewing as/i)).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText(/previewing as/i)).not.toBeInTheDocument();
  });

  it("should hide token palette in preview mode", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("World"));
    // Token palette should be visible in normal mode
    expect(screen.getByText("Tokens")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /preview.*player.*view/i }));
    // Token palette should be hidden in preview mode
    expect(screen.queryByText("Tokens")).not.toBeInTheDocument();
  });

  it("should disable preview button when no players exist", () => {
    const useCampaignPlayersMock = jest.requireMock("@/hooks/use-campaign-players");
    const spy = jest.spyOn(useCampaignPlayersMock, "useCampaignPlayers").mockReturnValue({
      players: [],
      playerCount: 0,
      isLoading: false,
      isError: false,
      hasActiveInvitation: false,
      allReady: false,
    });

    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("World"));
    const previewButton = screen.getByRole("button", { name: /preview.*player.*view/i });
    expect(previewButton).toBeDisabled();

    spy.mockRestore();
  });

  it("renders breadcrumb with Dashboard, Campaign, and Maps", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText("breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Test Campaign" })).toHaveAttribute("href", "/campaign/c1/gm/prep");
  });

  it("renders back button linking to GM prep page", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    const backButton = screen.getByLabelText("Go back");
    expect(backButton).toHaveAttribute("href", "/campaign/c1/gm/prep");
  });

  it("should render fog toolbar on maps page (GM mode)", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("World"));

    expect(screen.getByTestId("fog-reveal-button")).toBeInTheDocument();
  });

  it("should show fog player selector when fog tool activated", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("World"));
    fireEvent.click(screen.getByTestId("fog-reveal-button"));

    expect(screen.getByTestId("fog-player-selector")).toBeInTheDocument();
  });

  it("should hide fog toolbar in preview mode", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("World"));
    expect(screen.getByTestId("fog-reveal-button")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /preview.*player.*view/i }));
    expect(screen.queryByTestId("fog-reveal-button")).not.toBeInTheDocument();
  });

  it("should hide fog player selector when fog tool is not active", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("World"));

    expect(screen.queryByTestId("fog-player-selector")).not.toBeInTheDocument();
  });

  it("should render Reveal to All button on maps page", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("World"));

    expect(screen.getByTestId("fog-reveal-all-button")).toBeInTheDocument();
  });

  it("should hide fog player selector when Reveal to All is active", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("World"));
    fireEvent.click(screen.getByTestId("fog-reveal-all-button"));

    expect(screen.queryByTestId("fog-player-selector")).not.toBeInTheDocument();
    expect(screen.getByTestId("fog-reveal-all-label")).toBeInTheDocument();
    expect(screen.getByText("Revealing to all players")).toBeInTheDocument();
  });

  it("should switch between targeted and global reveal correctly", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("World"));

    // Activate targeted reveal
    fireEvent.click(screen.getByTestId("fog-reveal-button"));
    expect(screen.getByTestId("fog-player-selector")).toBeInTheDocument();
    expect(screen.queryByTestId("fog-reveal-all-label")).not.toBeInTheDocument();

    // Switch to global reveal
    fireEvent.click(screen.getByTestId("fog-reveal-all-button"));
    expect(screen.queryByTestId("fog-player-selector")).not.toBeInTheDocument();
    expect(screen.getByTestId("fog-reveal-all-label")).toBeInTheDocument();

    // Switch back to targeted reveal
    fireEvent.click(screen.getByTestId("fog-reveal-button"));
    expect(screen.getByTestId("fog-player-selector")).toBeInTheDocument();
    expect(screen.queryByTestId("fog-reveal-all-label")).not.toBeInTheDocument();
  });

  it("should not show Reveal to All label when fog-reveal-all is inactive", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("World"));

    expect(screen.queryByTestId("fog-reveal-all-label")).not.toBeInTheDocument();
  });
});
