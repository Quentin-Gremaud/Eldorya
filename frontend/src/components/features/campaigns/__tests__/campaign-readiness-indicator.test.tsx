import { render, screen } from "@testing-library/react";
import { CampaignReadinessIndicator } from "../campaign-readiness-indicator";
import type { PlayerOnboardingItem } from "@/types/api";

const joinedPlayer: PlayerOnboardingItem = {
  userId: "user-1",
  displayName: "Alice",
  status: "joined",
  joinedAt: "2026-03-01T10:00:00.000Z",
};

const readyPlayer: PlayerOnboardingItem = {
  userId: "user-2",
  displayName: "Bob",
  status: "ready",
  joinedAt: "2026-03-02T10:00:00.000Z",
};

describe("CampaignReadinessIndicator", () => {
  it("shows 'all ready' banner when allReady is true", () => {
    render(
      <CampaignReadinessIndicator
        players={[readyPlayer]}
        allReady={true}
      />
    );

    expect(
      screen.getByText(
        "All players are ready! You can launch your first session."
      )
    ).toBeInTheDocument();
  });

  it("shows progress when partially ready", () => {
    render(
      <CampaignReadinessIndicator
        players={[joinedPlayer, readyPlayer]}
        allReady={false}
      />
    );

    expect(screen.getByText("1/2 players ready")).toBeInTheDocument();
  });

  it("shows 0/N progress when no players are ready", () => {
    render(
      <CampaignReadinessIndicator
        players={[joinedPlayer]}
        allReady={false}
      />
    );

    expect(screen.getByText("0/1 players ready")).toBeInTheDocument();
  });

  it("renders nothing when no players exist", () => {
    const { container } = render(
      <CampaignReadinessIndicator players={[]} allReady={false} />
    );

    expect(container.innerHTML).toBe("");
  });
});
