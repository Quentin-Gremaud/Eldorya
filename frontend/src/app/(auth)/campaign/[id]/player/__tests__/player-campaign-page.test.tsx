import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { PlayerCampaignContent } from "../page";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: jest.fn().mockResolvedValue("mock-token") }),
}));

jest.mock("date-fns", () => ({
  formatDistanceToNow: () => "3 days ago",
}));

jest.mock("@/hooks/use-my-character", () => ({
  useMyCharacter: () => ({
    character: null,
    isLoading: false,
    isError: false,
  }),
}));

const mockUseActiveSession = jest.fn();
const mockUseSessionNotification = jest.fn();

jest.mock("@/hooks/use-active-session", () => ({
  useActiveSession: (...args: unknown[]) => mockUseActiveSession(...args),
}));

jest.mock("@/hooks/use-session-notification", () => ({
  useSessionNotification: (...args: unknown[]) => mockUseSessionNotification(...args),
}));

const mockUseMapLevels = jest.fn().mockReturnValue({
  mapLevels: [
    { id: "l1", campaignId: "c1", name: "World", parentId: null, depth: 0, backgroundImageUrl: null, createdAt: "2026-03-08", updatedAt: "2026-03-08" },
    { id: "l2", campaignId: "c1", name: "Dungeon", parentId: "l1", depth: 1, backgroundImageUrl: null, createdAt: "2026-03-08", updatedAt: "2026-03-08" },
  ],
  isLoading: false,
  isError: false,
});

jest.mock("@/hooks/use-map-levels", () => ({
  useMapLevels: (...args: unknown[]) => mockUseMapLevels(...args),
}));

const mockUseCampaign = jest.fn();
const mockUseCampaignAnnouncements = jest.fn();

jest.mock("@/hooks/use-campaign", () => ({
  useCampaign: (...args: unknown[]) => mockUseCampaign(...args),
}));

jest.mock("@/hooks/use-campaign-announcements", () => ({
  useCampaignAnnouncements: () => mockUseCampaignAnnouncements(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("PlayerCampaignContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCampaignAnnouncements.mockReturnValue({
      announcements: [],
      totalCount: 0,
      isLoading: false,
      isError: false,
    });
    mockUseActiveSession.mockReturnValue({
      session: null,
      isLoading: false,
      isError: false,
    });
    mockUseSessionNotification.mockReturnValue({
      isSessionLive: false,
      liveSessionId: null,
    });
  });

  it("shows loading skeletons while fetching campaign", () => {
    mockUseCampaign.mockReturnValue({
      campaign: null,
      isLoading: true,
      isError: false,
    });

    const { container } = render(
      <PlayerCampaignContent campaignId="campaign-1" />
    );

    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders campaign details when loaded", () => {
    mockUseCampaign.mockReturnValue({
      campaign: {
        id: "campaign-1",
        name: "Dragon Quest",
        description: "An epic adventure",
        coverImageUrl: null,
        status: "active",
        gmDisplayName: "John Doe",
        playerCount: 4,
        lastSessionDate: "2026-03-01T10:00:00Z",
        userRole: "player",
        createdAt: "2026-01-01T00:00:00Z",
      },
      isLoading: false,
      isError: false,
    });

    render(<PlayerCampaignContent campaignId="campaign-1" />);

    expect(screen.getByRole("heading", { name: "Dragon Quest" })).toBeInTheDocument();
    expect(screen.getByText("GM: John Doe")).toBeInTheDocument();
    expect(screen.getByText("4 players")).toBeInTheDocument();
    expect(screen.getByText("An epic adventure")).toBeInTheDocument();
  });

  it("shows placeholder sections for future features", () => {
    mockUseCampaign.mockReturnValue({
      campaign: {
        id: "campaign-1",
        name: "Test Campaign",
        description: null,
        coverImageUrl: null,
        status: "active",
        gmDisplayName: "GM Name",
        playerCount: 2,
        lastSessionDate: null,
        userRole: "player",
        createdAt: "2026-01-01T00:00:00Z",
      },
      isLoading: false,
      isError: false,
    });

    render(<PlayerCampaignContent campaignId="campaign-1" />);

    expect(screen.getByText("Character")).toBeInTheDocument();
    expect(screen.getByText("Map")).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Inventory")).toBeInTheDocument();
  });

  it("renders map card with link to maps page", () => {
    mockUseCampaign.mockReturnValue({
      campaign: {
        id: "campaign-1",
        name: "Test Campaign",
        description: null,
        coverImageUrl: null,
        status: "active",
        gmDisplayName: "GM Name",
        playerCount: 2,
        lastSessionDate: null,
        userRole: "player",
        createdAt: "2026-01-01T00:00:00Z",
      },
      isLoading: false,
      isError: false,
    });

    render(<PlayerCampaignContent campaignId="campaign-1" />);

    // Map card links to the maps page
    const mapCard = screen.getByText("Map").closest("a");
    expect(mapCard).toHaveAttribute("href", "/campaign/campaign-1/player/maps");
  });

  it("renders map card with level count when data available", () => {
    mockUseCampaign.mockReturnValue({
      campaign: {
        id: "campaign-1",
        name: "Test Campaign",
        description: null,
        coverImageUrl: null,
        status: "active",
        gmDisplayName: "GM Name",
        playerCount: 2,
        lastSessionDate: null,
        userRole: "player",
        createdAt: "2026-01-01T00:00:00Z",
      },
      isLoading: false,
      isError: false,
    });

    mockUseMapLevels.mockReturnValue({
      mapLevels: [
        { id: "l1", campaignId: "campaign-1", name: "World", parentId: null, depth: 0, backgroundImageUrl: null, createdAt: "2026-03-08", updatedAt: "2026-03-08" },
        { id: "l2", campaignId: "campaign-1", name: "Dungeon", parentId: "l1", depth: 1, backgroundImageUrl: null, createdAt: "2026-03-08", updatedAt: "2026-03-08" },
      ],
      isLoading: false,
      isError: false,
    });

    render(<PlayerCampaignContent campaignId="campaign-1" />);

    expect(screen.getByText("2 map levels available")).toBeInTheDocument();
  });

  it("renders breadcrumb with Dashboard and campaign name", () => {
    mockUseCampaign.mockReturnValue({
      campaign: {
        id: "campaign-1",
        name: "Dragon Quest",
        description: null,
        coverImageUrl: null,
        status: "active",
        gmDisplayName: "GM Name",
        playerCount: 2,
        lastSessionDate: null,
        userRole: "player",
        createdAt: "2026-01-01T00:00:00Z",
      },
      isLoading: false,
      isError: false,
    });

    render(<PlayerCampaignContent campaignId="campaign-1" />);

    expect(screen.getByLabelText("breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
  });

  it("renders back button linking to dashboard", () => {
    mockUseCampaign.mockReturnValue({
      campaign: {
        id: "campaign-1",
        name: "Dragon Quest",
        description: null,
        coverImageUrl: null,
        status: "active",
        gmDisplayName: "GM Name",
        playerCount: 2,
        lastSessionDate: null,
        userRole: "player",
        createdAt: "2026-01-01T00:00:00Z",
      },
      isLoading: false,
      isError: false,
    });

    render(<PlayerCampaignContent campaignId="campaign-1" />);

    const backButton = screen.getByLabelText("Go back");
    expect(backButton).toHaveAttribute("href", "/dashboard");
  });

  it("redirects to dashboard on error", async () => {
    mockUseCampaign.mockReturnValue({
      campaign: null,
      isLoading: false,
      isError: true,
    });

    render(<PlayerCampaignContent campaignId="campaign-1" />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("passes campaignId to useCampaign hook", () => {
    mockUseCampaign.mockReturnValue({
      campaign: null,
      isLoading: true,
      isError: false,
    });

    render(<PlayerCampaignContent campaignId="my-campaign-id" />);

    expect(mockUseCampaign).toHaveBeenCalledWith("my-campaign-id");
  });

  it("shows live session banner with Join Session link when session is live", () => {
    mockUseCampaign.mockReturnValue({
      campaign: {
        id: "campaign-1",
        name: "Dragon Quest",
        description: null,
        coverImageUrl: null,
        status: "active",
        gmDisplayName: "GM Name",
        playerCount: 4,
        lastSessionDate: null,
        userRole: "player",
        createdAt: "2026-01-01T00:00:00Z",
      },
      isLoading: false,
      isError: false,
    });

    mockUseActiveSession.mockReturnValue({
      session: { id: "session-1", campaignId: "campaign-1", mode: "live" },
      isLoading: false,
      isError: false,
    });

    mockUseSessionNotification.mockReturnValue({
      isSessionLive: true,
      liveSessionId: "session-1",
    });

    render(<PlayerCampaignContent campaignId="campaign-1" />);

    expect(screen.getByText("A session is live!")).toBeInTheDocument();
    const joinLink = screen.getByRole("link", { name: /Join Session/i });
    expect(joinLink).toHaveAttribute("href", "/campaign/campaign-1/player/session");
  });

  it("shows preparing indicator when session is in preparation mode", () => {
    mockUseCampaign.mockReturnValue({
      campaign: {
        id: "campaign-1",
        name: "Dragon Quest",
        description: null,
        coverImageUrl: null,
        status: "active",
        gmDisplayName: "GM Name",
        playerCount: 4,
        lastSessionDate: null,
        userRole: "player",
        createdAt: "2026-01-01T00:00:00Z",
      },
      isLoading: false,
      isError: false,
    });

    mockUseActiveSession.mockReturnValue({
      session: { id: "session-2", campaignId: "campaign-1", mode: "preparation" },
      isLoading: false,
      isError: false,
    });

    mockUseSessionNotification.mockReturnValue({
      isSessionLive: false,
      liveSessionId: null,
    });

    render(<PlayerCampaignContent campaignId="campaign-1" />);

    expect(screen.getByText(/GM is preparing the session/)).toBeInTheDocument();
    expect(screen.getByText("Preparing")).toBeInTheDocument();
    expect(screen.queryByText("A session is live!")).not.toBeInTheDocument();
  });

  it("does not show session banner when no active session", () => {
    mockUseCampaign.mockReturnValue({
      campaign: {
        id: "campaign-1",
        name: "Dragon Quest",
        description: null,
        coverImageUrl: null,
        status: "active",
        gmDisplayName: "GM Name",
        playerCount: 4,
        lastSessionDate: null,
        userRole: "player",
        createdAt: "2026-01-01T00:00:00Z",
      },
      isLoading: false,
      isError: false,
    });

    mockUseActiveSession.mockReturnValue({
      session: null,
      isLoading: false,
      isError: false,
    });

    mockUseSessionNotification.mockReturnValue({
      isSessionLive: false,
      liveSessionId: null,
    });

    render(<PlayerCampaignContent campaignId="campaign-1" />);

    expect(screen.queryByText("A session is live!")).not.toBeInTheDocument();
    expect(screen.queryByText(/GM is preparing the session/)).not.toBeInTheDocument();
    expect(screen.queryByText("Preparing")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Join Session/i })).not.toBeInTheDocument();
  });
});
