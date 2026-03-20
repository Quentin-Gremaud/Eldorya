import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, createElement } from "react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/hooks/use-active-session", () => ({
  useActiveSession: () => ({
    session: { id: "sess-1", campaignId: "camp-1", mode: "live" },
    isLoading: false,
  }),
}));

const mockCockpitState = jest.fn();
jest.mock("@/hooks/use-cockpit-state", () => ({
  useCockpitState: () => mockCockpitState(),
}));

jest.mock("@/hooks/use-presence", () => ({
  usePresence: () => ({
    presences: [],
    getPresence: (userId: string) =>
      userId === "player-1" ? "online" : "disconnected",
  }),
}));

jest.mock("@/hooks/use-campaign-players", () => ({
  useCampaignPlayers: () => ({
    players: [
      { userId: "player-1", displayName: "Alice", status: "ready" },
      { userId: "player-2", displayName: "Bob", status: "joined" },
    ],
  }),
}));

jest.mock("@/hooks/use-campaign-characters", () => ({
  useCampaignCharacters: () => ({
    characters: [
      {
        id: "char-1",
        userId: "player-1",
        name: "Aragorn",
        race: "Human",
        characterClass: "Ranger",
        background: "Wanderer",
        stats: { strength: 16, dexterity: 14, constitution: 12, intelligence: 10, wisdom: 14, charisma: 12 },
        spells: ["Cure Wounds"],
        status: "approved",
      },
    ],
  }),
}));

jest.mock("@/components/shared/presence-indicator", () => ({
  PresenceIndicator: ({ displayName, status }: { displayName: string; status: string }) => (
    <div data-testid={`presence-${displayName}`}>{status}</div>
  ),
}));

jest.mock("@/components/features/characters/stat-block", () => ({
  StatBlockGrid: () => <div data-testid="stat-block-grid">Stats</div>,
}));

jest.mock("@/providers/web-socket-provider", () => ({
  useWebSocketContext: () => ({
    socket: { on: jest.fn(), off: jest.fn() },
  }),
}));

import GmPlayersPage from "../page";

async function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(
          Suspense,
          { fallback: createElement("div", null, "Loading...") },
          createElement(GmPlayersPage, {
            params: Promise.resolve({ id: "camp-1" }),
          })
        )
      )
    );
  });
  return result!;
}

describe("GmPlayersPage", () => {
  beforeEach(() => {
    mockCockpitState.mockReturnValue({
      cockpitState: {
        sessionId: "sess-1",
        campaignId: "camp-1",
        gmUserId: "gm-1",
        mode: "live",
        pipelineMode: "optional",
        pendingActionsCount: 0,
        players: [
          { userId: "player-1", role: "player", characterId: "char-1", characterName: "Aragorn", characterStatus: "approved" },
          { userId: "player-2", role: "player", characterId: null, characterName: null, characterStatus: null },
        ],
      },
      isLoading: false,
    });
  });

  it("should render the Players heading", async () => {
    await renderPage();
    expect(screen.getByText("Players")).toBeInTheDocument();
  });

  it("should render player cards with presence indicators", async () => {
    await renderPage();
    expect(screen.getByTestId("presence-Alice")).toBeInTheDocument();
    expect(screen.getByTestId("presence-Bob")).toBeInTheDocument();
  });

  it("should show character name for players with characters", async () => {
    await renderPage();
    expect(screen.getByText("Aragorn")).toBeInTheDocument();
  });

  it("should show approved badge for approved characters", async () => {
    await renderPage();
    expect(screen.getByText("approved")).toBeInTheDocument();
  });

  it("should expand character details on click", async () => {
    const user = userEvent.setup();
    await renderPage();

    const aliceCard = screen.getByText("Alice").closest("[class*='card']")!;
    await user.click(aliceCard);

    expect(screen.getByTestId("stat-block-grid")).toBeInTheDocument();
    expect(screen.getByText("Cure Wounds")).toBeInTheDocument();
  });

  it("should show empty state when no players", async () => {
    mockCockpitState.mockReturnValue({
      cockpitState: {
        sessionId: "sess-1",
        campaignId: "camp-1",
        gmUserId: "gm-1",
        mode: "live",
        pipelineMode: "optional",
        pendingActionsCount: 0,
        players: [],
      },
      isLoading: false,
    });

    await renderPage();
    expect(screen.getByText(/No players in this campaign/)).toBeInTheDocument();
  });
});
