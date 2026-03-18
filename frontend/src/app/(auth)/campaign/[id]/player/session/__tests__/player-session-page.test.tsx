import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Mock React.use() for params Promise
jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    use: (promise: Promise<{ id: string }>) => {
      if (promise && typeof promise === "object") {
        return { id: "campaign-123" };
      }
      return promise;
    },
  };
});

const mockUseActiveSession = jest.fn();

jest.mock("@/hooks/use-active-session", () => ({
  useActiveSession: (...args: unknown[]) => mockUseActiveSession(...args),
}));

jest.mock("@/hooks/use-session-web-socket", () => ({
  useSessionWebSocket: jest.fn(),
}));

jest.mock("@/hooks/use-map-levels", () => ({
  useMapLevels: () => ({
    mapLevels: [{ id: "ml-1", name: "World" }],
    isLoading: false,
    isError: false,
  }),
}));

jest.mock("@/hooks/use-tokens", () => ({
  useTokens: () => ({
    tokens: [],
    isLoading: false,
    isError: false,
  }),
}));

jest.mock("@/hooks/use-fog-state", () => ({
  useFogState: () => ({
    fogZones: [],
    isLoading: false,
    isError: false,
  }),
}));

jest.mock("@/hooks/use-campaign", () => ({
  useCampaign: () => ({
    campaign: { name: "Test Campaign" },
    isLoading: false,
    isError: false,
  }),
}));

const mockSocketEmit = jest.fn();
const mockSocketOn = jest.fn();
const mockSocketOff = jest.fn();

jest.mock("@/providers/web-socket-provider", () => ({
  useWebSocketContext: () => ({
    socket: {
      emit: mockSocketEmit,
      on: mockSocketOn,
      off: mockSocketOff,
    },
  }),
}));

jest.mock("@/hooks/use-ping-notification", () => ({
  usePingNotification: () => ({ isPinged: false, clearPing: jest.fn() }),
}));

jest.mock("@/hooks/use-propose-action", () => ({
  useProposeAction: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock("@/hooks/use-action-pipeline-web-socket", () => ({
  useActionPipelineWebSocket: jest.fn(),
}));

jest.mock("@/components/canvas/map-canvas", () => ({
  MapCanvas: () =>
    createElement("div", { "data-testid": "map-canvas" }, "MapCanvas"),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// Dynamic import after mocks are set up
let PlayerSessionPage: React.ComponentType<{
  params: Promise<{ id: string }>;
}>;

beforeAll(async () => {
  const mod = await import("../page");
  PlayerSessionPage = mod.default;
});

describe("PlayerSessionPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading skeleton when session is loading", () => {
    mockUseActiveSession.mockReturnValue({
      session: null,
      isLoading: true,
      isError: false,
    });

    const { container } = render(
      <PlayerSessionPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("redirects to player campaign page when no active session", async () => {
    mockUseActiveSession.mockReturnValue({
      session: null,
      isLoading: false,
      isError: false,
    });

    render(
      <PlayerSessionPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/campaign/campaign-123/player");
    });
  });

  it("renders 'Game Session' heading", () => {
    mockUseActiveSession.mockReturnValue({
      session: { id: "session-1", mode: "live" },
      isLoading: false,
      isError: false,
    });

    render(
      <PlayerSessionPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByRole("heading", { name: "Game Session" })
    ).toBeInTheDocument();
  });

  it("shows LIVE badge when session mode is 'live'", () => {
    mockUseActiveSession.mockReturnValue({
      session: { id: "session-1", mode: "live" },
      isLoading: false,
      isError: false,
    });

    render(
      <PlayerSessionPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("LIVE")).toBeInTheDocument();
  });

  it("shows 'GM is preparing…' text when session mode is 'preparation'", () => {
    mockUseActiveSession.mockReturnValue({
      session: { id: "session-1", mode: "preparation" },
      isLoading: false,
      isError: false,
    });

    render(
      <PlayerSessionPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("GM is preparing…")).toBeInTheDocument();
  });

  it("shows preparing indicator block with 'The GM is preparing the session' when not live", () => {
    mockUseActiveSession.mockReturnValue({
      session: { id: "session-1", mode: "preparation" },
      isLoading: false,
      isError: false,
    });

    render(
      <PlayerSessionPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByText(
        "The GM is preparing the session. The map will appear when the session goes live."
      )
    ).toBeInTheDocument();
  });

  it("emits join-session WebSocket command when session is live", () => {
    mockUseActiveSession.mockReturnValue({
      session: { id: "session-1", mode: "live" },
      isLoading: false,
      isError: false,
    });

    render(
      <PlayerSessionPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(mockSocketEmit).toHaveBeenCalledWith("join-session", {
      sessionId: "session-1",
    });
  });

  it("does NOT emit join-session when session is in preparation", () => {
    mockUseActiveSession.mockReturnValue({
      session: { id: "session-1", mode: "preparation" },
      isLoading: false,
      isError: false,
    });

    render(
      <PlayerSessionPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(mockSocketEmit).not.toHaveBeenCalled();
  });

  it("renders back button linking to /campaign/{id}/player", () => {
    mockUseActiveSession.mockReturnValue({
      session: { id: "session-1", mode: "live" },
      isLoading: false,
      isError: false,
    });

    render(
      <PlayerSessionPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    const backButton = screen.getByLabelText("Back to campaign");
    expect(backButton).toHaveAttribute(
      "href",
      "/campaign/campaign-123/player"
    );
  });

  it("renders breadcrumb with Dashboard, campaign name, Session", () => {
    mockUseActiveSession.mockReturnValue({
      session: { id: "session-1", mode: "live" },
      isLoading: false,
      isError: false,
    });

    render(
      <PlayerSessionPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText("breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard"
    );
    expect(
      screen.getByRole("link", { name: "Test Campaign" })
    ).toHaveAttribute("href", "/campaign/campaign-123/player");
    expect(screen.getByText("Session")).toBeInTheDocument();
  });

  it("does not show map canvas when in preparation mode", () => {
    mockUseActiveSession.mockReturnValue({
      session: { id: "session-1", mode: "preparation" },
      isLoading: false,
      isError: false,
    });

    render(
      <PlayerSessionPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByTestId("map-canvas")).not.toBeInTheDocument();
  });

  it("shows map canvas when in live mode with map levels", () => {
    mockUseActiveSession.mockReturnValue({
      session: { id: "session-1", mode: "live" },
      isLoading: false,
      isError: false,
    });

    render(
      <PlayerSessionPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId("map-canvas")).toBeInTheDocument();
  });
});
