import { render, screen, fireEvent } from "@testing-library/react";
import { PendingActionQueue } from "../pending-action-queue";
import type { PendingAction } from "@/types/api";

const mockActions: PendingAction[] = [
  {
    id: "action-1",
    sessionId: "session-1",
    campaignId: "campaign-1",
    playerId: "player-1",
    actionType: "move",
    description: "I move to the north gate",
    target: null,
    status: "pending",
    proposedAt: new Date().toISOString(),
  },
  {
    id: "action-2",
    sessionId: "session-1",
    campaignId: "campaign-1",
    playerId: "player-2",
    actionType: "attack",
    description: "I attack the goblin",
    target: "Goblin",
    status: "pending",
    proposedAt: new Date().toISOString(),
  },
];

jest.mock("@/hooks/use-pending-actions", () => ({
  usePendingActions: jest.fn(() => ({ actions: mockActions })),
}));

jest.mock("@/hooks/use-action-pipeline-web-socket", () => ({
  useActionPipelineWebSocket: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { usePendingActions } = require("@/hooks/use-pending-actions");

describe("PendingActionQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePendingActions as jest.Mock).mockReturnValue({ actions: mockActions });
  });

  it("shows 'No pending actions' when empty", () => {
    (usePendingActions as jest.Mock).mockReturnValue({ actions: [] });

    render(
      <PendingActionQueue campaignId="campaign-1" sessionId="session-1" />
    );

    expect(screen.getByText("No pending actions")).toBeInTheDocument();
  });

  it("renders action cards for each pending action", () => {
    render(
      <PendingActionQueue campaignId="campaign-1" sessionId="session-1" />
    );

    expect(screen.getByText("I move to the north gate")).toBeInTheDocument();
    expect(screen.getByText("I attack the goblin")).toBeInTheDocument();
  });

  it("shows count in header", () => {
    render(
      <PendingActionQueue campaignId="campaign-1" sessionId="session-1" />
    );

    expect(screen.getByText("Pending Actions (2)")).toBeInTheDocument();
  });

  it("shows zero count when empty", () => {
    (usePendingActions as jest.Mock).mockReturnValue({ actions: [] });

    render(
      <PendingActionQueue campaignId="campaign-1" sessionId="session-1" />
    );

    expect(screen.getByText("Pending Actions (0)")).toBeInTheDocument();
  });

  it("collapse toggle hides action cards", () => {
    render(
      <PendingActionQueue campaignId="campaign-1" sessionId="session-1" />
    );

    // Actions should be visible initially
    expect(screen.getByText("I move to the north gate")).toBeInTheDocument();

    // Click collapse button
    fireEvent.click(screen.getByRole("button", { name: "Collapse queue" }));

    // Actions should be hidden
    expect(
      screen.queryByText("I move to the north gate")
    ).not.toBeInTheDocument();
  });

  it("expand toggle shows action cards again", () => {
    render(
      <PendingActionQueue campaignId="campaign-1" sessionId="session-1" />
    );

    // Collapse
    fireEvent.click(screen.getByRole("button", { name: "Collapse queue" }));
    expect(
      screen.queryByText("I move to the north gate")
    ).not.toBeInTheDocument();

    // Expand
    fireEvent.click(screen.getByRole("button", { name: "Expand queue" }));
    expect(screen.getByText("I move to the north gate")).toBeInTheDocument();
  });
});
