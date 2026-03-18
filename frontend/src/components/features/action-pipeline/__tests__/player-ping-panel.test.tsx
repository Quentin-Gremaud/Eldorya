import { render, screen, fireEvent } from "@testing-library/react";
import { PlayerPingPanel } from "../player-ping-panel";

const mockMutate = jest.fn();

jest.mock("@/hooks/use-ping-player", () => ({
  usePingPlayer: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

jest.mock("@/hooks/use-ping-status", () => ({
  usePingStatus: jest.fn(() => ({
    pingStatus: null,
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { usePingStatus } = require("@/hooks/use-ping-status");

const players = [
  { userId: "player-1", displayName: "Aragorn" },
  { userId: "player-2", displayName: "Legolas" },
  { userId: "player-3", displayName: "Gimli" },
];

describe("PlayerPingPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePingStatus as jest.Mock).mockReturnValue({ pingStatus: null });
  });

  it("renders player list", () => {
    render(
      <PlayerPingPanel
        campaignId="campaign-1"
        sessionId="session-1"
        players={players}
      />
    );

    expect(screen.getByText("Players")).toBeInTheDocument();
    expect(screen.getByText("Aragorn")).toBeInTheDocument();
    expect(screen.getByText("Legolas")).toBeInTheDocument();
    expect(screen.getByText("Gimli")).toBeInTheDocument();
  });

  it("shows 'No players connected' when empty", () => {
    render(
      <PlayerPingPanel
        campaignId="campaign-1"
        sessionId="session-1"
        players={[]}
      />
    );

    expect(screen.getByText("No players connected")).toBeInTheDocument();
  });

  it("ping button calls mutation with correct payload", () => {
    render(
      <PlayerPingPanel
        campaignId="campaign-1"
        sessionId="session-1"
        players={players}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Ping Aragorn" }));

    expect(mockMutate).toHaveBeenCalledWith({
      campaignId: "campaign-1",
      sessionId: "session-1",
      playerId: "player-1",
    });
  });

  it("pinged player has amber highlight", () => {
    (usePingStatus as jest.Mock).mockReturnValue({
      pingStatus: { playerId: "player-2", pingedAt: new Date().toISOString() },
    });

    render(
      <PlayerPingPanel
        campaignId="campaign-1"
        sessionId="session-1"
        players={players}
      />
    );

    // The pinged player's row should have amber styling
    const legolasRow = screen.getByText("Legolas").closest("div");
    expect(legolasRow?.className).toContain("amber");

    // Non-pinged player should not have amber styling
    const aragornRow = screen.getByText("Aragorn").closest("div");
    expect(aragornRow?.className).not.toContain("amber");
  });

  it("renders ping button for each player", () => {
    render(
      <PlayerPingPanel
        campaignId="campaign-1"
        sessionId="session-1"
        players={players}
      />
    );

    expect(screen.getByRole("button", { name: "Ping Aragorn" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ping Legolas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ping Gimli" })).toBeInTheDocument();
  });
});
