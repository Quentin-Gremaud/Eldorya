import { render, screen } from "@testing-library/react";
import { ActionCard } from "../action-card";
import type { PendingAction } from "@/types/api";

function makeAction(overrides: Partial<PendingAction> = {}): PendingAction {
  return {
    id: "action-1",
    sessionId: "session-1",
    campaignId: "campaign-1",
    playerId: "player-1",
    actionType: "move",
    description: "I move to the north gate",
    target: null,
    status: "pending",
    proposedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("ActionCard", () => {
  it("renders action type badge with correct label for move", () => {
    render(<ActionCard action={makeAction({ actionType: "move" })} />);

    expect(screen.getByText("Move")).toBeInTheDocument();
  });

  it("renders action type badge with correct label for attack", () => {
    render(<ActionCard action={makeAction({ actionType: "attack" })} />);

    expect(screen.getByText("Attack")).toBeInTheDocument();
  });

  it("renders action type badge with correct label for interact", () => {
    render(<ActionCard action={makeAction({ actionType: "interact" })} />);

    expect(screen.getByText("Interact")).toBeInTheDocument();
  });

  it("renders action type badge with correct label for free-text", () => {
    render(<ActionCard action={makeAction({ actionType: "free-text" })} />);

    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(
      <ActionCard action={makeAction({ description: "I search the room" })} />
    );

    expect(screen.getByText("I search the room")).toBeInTheDocument();
  });

  it("renders target when present", () => {
    render(<ActionCard action={makeAction({ target: "Goblin King" })} />);

    expect(screen.getByText("Target: Goblin King")).toBeInTheDocument();
  });

  it("does not render target when absent", () => {
    render(<ActionCard action={makeAction({ target: null })} />);

    expect(screen.queryByText(/Target:/)).not.toBeInTheDocument();
  });

  it("shows 'just now' for recent actions", () => {
    render(
      <ActionCard
        action={makeAction({ proposedAt: new Date().toISOString() })}
      />
    );

    expect(screen.getByText("just now")).toBeInTheDocument();
  });

  it("shows minutes ago for older actions", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    render(<ActionCard action={makeAction({ proposedAt: fiveMinutesAgo })} />);

    expect(screen.getByText("5m ago")).toBeInTheDocument();
  });

  it("shows hours ago for much older actions", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    render(<ActionCard action={makeAction({ proposedAt: twoHoursAgo })} />);

    expect(screen.getByText("2h ago")).toBeInTheDocument();
  });
});
