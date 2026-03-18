import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

const mockUseActiveSession = jest.fn();
jest.mock("@/hooks/use-active-session", () => ({
  useActiveSession: () => mockUseActiveSession(),
}));

const mockMutate = jest.fn();
const mockUseChangeSessionMode = jest.fn();
jest.mock("@/hooks/use-change-session-mode", () => ({
  useChangeSessionMode: () => mockUseChangeSessionMode(),
}));

jest.mock("@/hooks/use-session-web-socket", () => ({
  useSessionWebSocket: jest.fn(),
}));

jest.mock("@/hooks/use-map-levels", () => ({
  useMapLevels: () => ({ mapLevels: [], isLoading: false }),
}));

jest.mock("@/hooks/use-tokens", () => ({
  useTokens: () => ({ tokens: [] }),
}));

jest.mock("@/hooks/use-move-token", () => ({
  useMoveToken: () => ({ mutate: jest.fn() }),
}));

jest.mock("@/hooks/use-fog-state", () => ({
  useFogState: () => ({ fogZones: [] }),
}));

const mockUseCampaign = jest.fn();
jest.mock("@/hooks/use-campaign", () => ({
  useCampaign: () => mockUseCampaign(),
}));

jest.mock("@/hooks/use-campaign-players", () => ({
  useCampaignPlayers: () => ({
    players: [],
    hasActiveInvitation: false,
    allReady: false,
    playerCount: 0,
    isLoading: false,
    isError: false,
  }),
}));

jest.mock("@/hooks/use-pending-actions", () => ({
  usePendingActions: () => ({ actions: [] }),
}));

jest.mock("@/hooks/use-ping-status", () => ({
  usePingStatus: () => ({ pingStatus: null }),
}));

jest.mock("@/hooks/use-ping-player", () => ({
  usePingPlayer: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock("@/hooks/use-action-pipeline-web-socket", () => ({
  useActionPipelineWebSocket: jest.fn(),
}));

jest.mock("@/components/canvas/map-canvas", () => ({
  MapCanvas: () => createElement("div", { "data-testid": "map-canvas" }, "Mocked MapCanvas"),
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

// Dynamic import after mocks are set up
let GmSessionCockpitPage: React.ComponentType<{ params: Promise<{ id: string }> }>;

beforeAll(async () => {
  const mod = await import("../page");
  GmSessionCockpitPage = mod.default;
});

describe("GmSessionCockpitPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseCampaign.mockReturnValue({
      campaign: { name: "Test Campaign" },
      isLoading: false,
      isError: false,
    });

    mockUseActiveSession.mockReturnValue({
      session: { id: "session-1", mode: "preparation" },
      isLoading: false,
      isError: false,
    });

    mockUseChangeSessionMode.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it("renders loading skeleton when session is loading", () => {
    mockUseActiveSession.mockReturnValue({
      session: null,
      isLoading: true,
      isError: false,
    });

    render(
      <GmSessionCockpitPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByRole("heading", { name: "Session Cockpit" })).not.toBeInTheDocument();
    // Skeleton is rendered as main content
    expect(document.querySelector("main")).toBeInTheDocument();
  });

  it("redirects to prep page when no active session", async () => {
    mockUseActiveSession.mockReturnValue({
      session: null,
      isLoading: false,
      isError: false,
    });

    render(
      <GmSessionCockpitPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/campaign/campaign-123/gm/prep");
    });
  });

  it("renders Session Cockpit heading with Preparation badge when session in prep mode", () => {
    render(
      <GmSessionCockpitPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole("heading", { name: "Session Cockpit" })).toBeInTheDocument();
    expect(screen.getByText("Preparation")).toBeInTheDocument();
  });

  it("renders LIVE badge when session in live mode", () => {
    mockUseActiveSession.mockReturnValue({
      session: { id: "session-1", mode: "live" },
      isLoading: false,
      isError: false,
    });

    render(
      <GmSessionCockpitPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("LIVE")).toBeInTheDocument();
  });

  it("shows Go Live button in preparation mode", () => {
    render(
      <GmSessionCockpitPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole("button", { name: /Go Live/i })).toBeInTheDocument();
  });

  it("shows Switch to Prep button in live mode", () => {
    mockUseActiveSession.mockReturnValue({
      session: { id: "session-1", mode: "live" },
      isLoading: false,
      isError: false,
    });

    render(
      <GmSessionCockpitPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole("button", { name: /Switch to Prep/i })).toBeInTheDocument();
  });

  it("opens confirmation dialog when Go Live clicked", async () => {
    const user = userEvent.setup();

    render(
      <GmSessionCockpitPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByRole("button", { name: /Go Live/i }));

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
  });

  it("dialog contains correct confirmation text", async () => {
    const user = userEvent.setup();

    render(
      <GmSessionCockpitPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByRole("button", { name: /Go Live/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Players will be notified and can join the session. Continue?")
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Go Live?")).toBeInTheDocument();
  });

  it("calls changeMode.mutate with mode live when dialog confirmed", async () => {
    const user = userEvent.setup();

    render(
      <GmSessionCockpitPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    // Open dialog
    await user.click(screen.getByRole("button", { name: /Go Live/i }));

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    // Confirm in dialog - the AlertDialogAction also says "Go Live"
    const dialogActions = screen.getByRole("alertdialog");
    const confirmButton = dialogActions.querySelector("button:last-child")!;
    await user.click(confirmButton);

    expect(mockMutate).toHaveBeenCalledWith(
      {
        campaignId: "campaign-123",
        sessionId: "session-1",
        mode: "live",
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
      })
    );
  });

  it("calls changeMode.mutate with mode preparation when Switch to Prep clicked", async () => {
    const user = userEvent.setup();

    mockUseActiveSession.mockReturnValue({
      session: { id: "session-1", mode: "live" },
      isLoading: false,
      isError: false,
    });

    render(
      <GmSessionCockpitPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByRole("button", { name: /Switch to Prep/i }));

    expect(mockMutate).toHaveBeenCalledWith({
      campaignId: "campaign-123",
      sessionId: "session-1",
      mode: "preparation",
    });
  });

  it("renders back button linking to /campaign/{id}/gm/prep", () => {
    render(
      <GmSessionCockpitPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    const backButton = screen.getByLabelText("Back to campaign");
    expect(backButton).toHaveAttribute("href", "/campaign/campaign-123/gm/prep");
  });

  it("renders breadcrumb with Dashboard, campaign name, and Session", () => {
    render(
      <GmSessionCockpitPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText("breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Test Campaign" })).toHaveAttribute(
      "href",
      "/campaign/campaign-123/gm/prep"
    );
    expect(screen.getByText("Session")).toBeInTheDocument();
  });
});
