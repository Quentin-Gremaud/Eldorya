import { render, screen } from "@testing-library/react";
import { PlayerOnboardingList } from "../player-onboarding-list";
import type { PlayerOnboardingItem } from "@/types/api";

jest.mock("@/lib/utils", () => ({
  ...jest.requireActual("@/lib/utils"),
  formatRelativeDate: () => "2 days ago",
}));

const players: PlayerOnboardingItem[] = [
  {
    userId: "user-1",
    displayName: "Alice Smith",
    status: "joined",
    joinedAt: "2026-03-01T10:00:00.000Z",
  },
  {
    userId: "user-2",
    displayName: "Bob Jones",
    status: "ready",
    joinedAt: "2026-03-02T10:00:00.000Z",
  },
];

describe("PlayerOnboardingList", () => {
  it("renders player list with display names", () => {
    render(
      <PlayerOnboardingList
        players={players}
        hasActiveInvitation={false}
        isLoading={false}
      />
    );

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("renders status badges for each player", () => {
    render(
      <PlayerOnboardingList
        players={players}
        hasActiveInvitation={false}
        isLoading={false}
      />
    );

    expect(screen.getByText("Joined")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("shows pending invitation indicator when hasActiveInvitation is true", () => {
    render(
      <PlayerOnboardingList
        players={players}
        hasActiveInvitation={true}
        isLoading={false}
      />
    );

    expect(
      screen.getByText("An invitation link is active — more players may join")
    ).toBeInTheDocument();
  });

  it("does not show pending invitation indicator when hasActiveInvitation is false", () => {
    render(
      <PlayerOnboardingList
        players={players}
        hasActiveInvitation={false}
        isLoading={false}
      />
    );

    expect(
      screen.queryByText(
        "An invitation link is active — more players may join"
      )
    ).toBeNull();
  });

  it("shows empty state when no players and no active invitation", () => {
    render(
      <PlayerOnboardingList
        players={[]}
        hasActiveInvitation={false}
        isLoading={false}
      />
    );

    expect(screen.getByText("No players yet")).toBeInTheDocument();
    expect(
      screen.getByText("Generate an invitation link above to invite players")
    ).toBeInTheDocument();
  });

  it("shows waiting state when no players but active invitation exists", () => {
    render(
      <PlayerOnboardingList
        players={[]}
        hasActiveInvitation={true}
        isLoading={false}
      />
    );

    expect(
      screen.getByText("Waiting for players to join via invitation link")
    ).toBeInTheDocument();
  });

  it("shows loading skeleton when isLoading is true", () => {
    const { container } = render(
      <PlayerOnboardingList
        players={[]}
        hasActiveInvitation={false}
        isLoading={true}
      />
    );

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders join dates for each player", () => {
    render(
      <PlayerOnboardingList
        players={players}
        hasActiveInvitation={false}
        isLoading={false}
      />
    );

    const dateElements = screen.getAllByText("2 days ago");
    expect(dateElements).toHaveLength(2);
  });
});
