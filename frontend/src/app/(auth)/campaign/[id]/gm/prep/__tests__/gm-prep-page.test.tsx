import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: { firstName: "GM", lastName: "User" },
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockUseCampaign = jest.fn();
const mockUseCampaignPlayers = jest.fn();
const mockUseCampaignInvitation = jest.fn();
const mockUseCreateInvitation = jest.fn();
const mockUseRevokeInvitation = jest.fn();
const mockUseCampaignAnnouncements = jest.fn();
const mockUseSendAnnouncement = jest.fn();

jest.mock("@/hooks/use-campaign", () => ({
  useCampaign: () => mockUseCampaign(),
}));

jest.mock("@/hooks/use-campaign-players", () => ({
  useCampaignPlayers: () => mockUseCampaignPlayers(),
}));

jest.mock("@/hooks/use-campaign-invitation", () => ({
  useCampaignInvitation: () => mockUseCampaignInvitation(),
}));

jest.mock("@/hooks/use-create-invitation", () => ({
  useCreateInvitation: () => mockUseCreateInvitation(),
}));

jest.mock("@/hooks/use-revoke-invitation", () => ({
  useRevokeInvitation: () => mockUseRevokeInvitation(),
}));

jest.mock("@/hooks/use-campaign-announcements", () => ({
  useCampaignAnnouncements: () => mockUseCampaignAnnouncements(),
}));

jest.mock("@/hooks/use-send-announcement", () => ({
  useSendAnnouncement: () => mockUseSendAnnouncement(),
}));

jest.mock("@/hooks/use-pending-characters", () => ({
  usePendingCharacters: () => ({
    pendingCharacters: [],
    isLoading: false,
    isError: false,
  }),
}));

jest.mock("@/hooks/use-pending-modifications", () => ({
  usePendingModifications: () => ({
    modifications: [],
    isLoading: false,
    isError: false,
  }),
}));

jest.mock("@/components/features/characters/pending-modifications-list", () => ({
  PendingModificationsList: () => createElement("div", { "data-testid": "pending-modifications-list" }, "Mocked PendingModificationsList"),
}));

jest.mock("@/components/features/characters/pending-characters-list", () => ({
  PendingCharactersList: () => createElement("div", { "data-testid": "pending-characters-list" }, "Mocked PendingCharactersList"),
}));

const mockUseCampaignCharacters = jest.fn();

jest.mock("@/hooks/use-campaign-characters", () => ({
  useCampaignCharacters: () => mockUseCampaignCharacters(),
}));

jest.mock("@/components/features/characters/campaign-characters-list", () => ({
  CampaignCharactersList: () => createElement("div", { "data-testid": "campaign-characters-list" }, "Mocked CampaignCharactersList"),
}));

jest.mock("@/hooks/use-archive-campaign", () => ({
  useArchiveCampaign: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock("@/hooks/use-reactivate-campaign", () => ({
  useReactivateCampaign: () => ({ mutate: jest.fn(), isPending: false }),
}));

const mockUseActiveSession = jest.fn();
const mockUseStartSession = jest.fn();

jest.mock("@/hooks/use-active-session", () => ({
  useActiveSession: (...args: unknown[]) => mockUseActiveSession(...args),
}));

jest.mock("@/hooks/use-start-session", () => ({
  useStartSession: () => mockUseStartSession(),
}));

jest.mock("@/lib/utils", () => ({
  ...jest.requireActual("@/lib/utils"),
  formatRelativeDate: () => "2 days ago",
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
let GmPrepPage: React.ComponentType<{ params: Promise<{ id: string }> }>;

beforeAll(async () => {
  const mod = await import("../page");
  GmPrepPage = mod.default;
});

describe("GmPrepPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseCampaign.mockReturnValue({
      campaign: { name: "Test Campaign", status: "active" },
      isLoading: false,
      isError: false,
    });

    mockUseCampaignPlayers.mockReturnValue({
      players: [
        {
          userId: "user-1",
          displayName: "Alice Smith",
          status: "joined",
          joinedAt: "2026-03-01T10:00:00.000Z",
        },
      ],
      hasActiveInvitation: false,
      allReady: false,
      playerCount: 1,
      isLoading: false,
      isError: false,
    });

    mockUseCampaignInvitation.mockReturnValue({
      invitation: null,
      isLoading: false,
      isError: false,
    });

    mockUseCreateInvitation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    mockUseRevokeInvitation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    mockUseCampaignAnnouncements.mockReturnValue({
      announcements: [],
      totalCount: 0,
      isLoading: false,
      isError: false,
    });

    mockUseSendAnnouncement.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
    });

    mockUseCampaignCharacters.mockReturnValue({
      characters: [],
      isLoading: false,
      isError: false,
    });

    mockUseActiveSession.mockReturnValue({
      session: null,
      isLoading: false,
      isError: false,
    });

    mockUseStartSession.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
  });

  it("renders campaign name in header", () => {
    render(
      <GmPrepPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole("heading", { name: "Test Campaign" })).toBeInTheDocument();
  });

  it("renders breadcrumb with Dashboard and campaign name", () => {
    render(
      <GmPrepPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText("breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
  });

  it("renders back button linking to dashboard", () => {
    render(
      <GmPrepPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    const backButton = screen.getByLabelText("Go back");
    expect(backButton).toHaveAttribute("href", "/dashboard");
  });

  it("renders Maps navigation card linking to maps page", () => {
    render(
      <GmPrepPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    const mapsLink = screen.getByText("Maps").closest("a");
    expect(mapsLink).toHaveAttribute("href", "/campaign/campaign-123/gm/prep/maps");
  });

  it("renders Player Invitations section", () => {
    render(
      <GmPrepPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Player Invitations")).toBeInTheDocument();
  });

  it("renders Players section with player count badge", () => {
    render(
      <GmPrepPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Players")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders player onboarding list with player data", () => {
    render(
      <GmPrepPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Joined")).toBeInTheDocument();
  });

  it("renders readiness indicator alongside player list", () => {
    mockUseCampaignPlayers.mockReturnValue({
      players: [
        {
          userId: "user-1",
          displayName: "Alice",
          status: "joined",
          joinedAt: "2026-03-01T10:00:00.000Z",
        },
      ],
      hasActiveInvitation: false,
      allReady: false,
      playerCount: 1,
      isLoading: false,
      isError: false,
    });

    render(
      <GmPrepPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("0/1 players ready")).toBeInTheDocument();
  });

  it("does not show player count badge while loading", () => {
    mockUseCampaignPlayers.mockReturnValue({
      players: [],
      hasActiveInvitation: false,
      allReady: false,
      playerCount: 0,
      isLoading: true,
      isError: false,
    });

    render(
      <GmPrepPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Players")).toBeInTheDocument();
    // playerCount is 0 and loading, so no badge should be shown
    expect(screen.queryByText("0")).toBeNull();
  });

  it("renders Announcements section", () => {
    render(
      <GmPrepPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Announcements")).toBeInTheDocument();
    expect(screen.getByText("Send Announcement")).toBeInTheDocument();
  });

  it("renders announcements with content", () => {
    mockUseCampaignAnnouncements.mockReturnValue({
      announcements: [
        {
          id: "ann-1",
          content: "Session tonight!",
          gmDisplayName: "GM Name",
          createdAt: "2026-03-07T10:00:00Z",
        },
      ],
      totalCount: 1,
      isLoading: false,
      isError: false,
    });

    render(
      <GmPrepPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Session tonight!")).toBeInTheDocument();
    expect(screen.getByText("GM Name")).toBeInTheDocument();
  });

  it("renders Character Management section with CampaignCharactersList", () => {
    mockUseCampaignCharacters.mockReturnValue({
      characters: [{ id: "char-1", name: "Gandalf" }],
      isLoading: false,
      isError: false,
    });

    render(
      <GmPrepPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Character Management")).toBeInTheDocument();
    expect(screen.getByTestId("campaign-characters-list")).toBeInTheDocument();
  });

  it("shows character count badge in Character Management section", () => {
    mockUseCampaignCharacters.mockReturnValue({
      characters: [
        { id: "char-1", name: "Gandalf" },
        { id: "char-2", name: "Aragorn" },
      ],
      isLoading: false,
      isError: false,
    });

    render(
      <GmPrepPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Character Management")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows error message when player data fails to load", () => {
    mockUseCampaignPlayers.mockReturnValue({
      players: [],
      hasActiveInvitation: false,
      allReady: false,
      playerCount: 0,
      isLoading: false,
      isError: true,
    });

    render(
      <GmPrepPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByText("Failed to load player data. Please try again later.")
    ).toBeInTheDocument();
    // Player list and readiness indicator should NOT be rendered
    expect(screen.queryByText("No players yet")).toBeNull();
  });

  it("renders Launch Session button when no active session", () => {
    mockUseActiveSession.mockReturnValue({
      session: null,
      isLoading: false,
      isError: false,
    });

    render(
      <GmPrepPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Game Session")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Launch Session/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Resume Session/i })).not.toBeInTheDocument();
  });

  it("renders Resume Session button when active session exists", () => {
    mockUseActiveSession.mockReturnValue({
      session: { id: "session-1", campaignId: "campaign-123", mode: "preparation" },
      isLoading: false,
      isError: false,
    });

    render(
      <GmPrepPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Game Session")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resume Session/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Launch Session/i })).not.toBeInTheDocument();
  });

  it("does not show session card for archived campaigns", () => {
    mockUseCampaign.mockReturnValue({
      campaign: { name: "Archived Campaign", status: "archived" },
      isLoading: false,
      isError: false,
    });

    render(
      <GmPrepPage params={Promise.resolve({ id: "campaign-123" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText("Game Session")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Launch Session/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Resume Session/i })).not.toBeInTheDocument();
  });
});
