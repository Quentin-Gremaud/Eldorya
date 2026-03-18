import { render, screen, fireEvent } from "@testing-library/react";
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

  describe("GM validation controls", () => {
    it("shows Validate, Reject, and One-Click Approve buttons when isGm", () => {
      render(
        <ActionCard
          action={makeAction()}
          isGm
          onApprove={jest.fn()}
          onReject={jest.fn()}
        />
      );

      expect(screen.getByText("Validate")).toBeInTheDocument();
      expect(screen.getByText("Reject")).toBeInTheDocument();
      expect(screen.getByLabelText("One-click approve")).toBeInTheDocument();
    });

    it("does not show buttons when not GM", () => {
      render(<ActionCard action={makeAction()} />);

      expect(screen.queryByText("Validate")).not.toBeInTheDocument();
      expect(screen.queryByText("Reject")).not.toBeInTheDocument();
    });

    it("shows narrative note textarea on Validate click", () => {
      render(
        <ActionCard
          action={makeAction()}
          isGm
          onApprove={jest.fn()}
          onReject={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText("Validate"));

      expect(screen.getByPlaceholderText(/narrative note/i)).toBeInTheDocument();
      expect(screen.getByText("Confirm")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("calls onApprove with narrative note on confirm", () => {
      const onApprove = jest.fn();
      render(
        <ActionCard
          action={makeAction()}
          isGm
          onApprove={onApprove}
          onReject={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText("Validate"));
      fireEvent.change(screen.getByPlaceholderText(/narrative note/i), {
        target: { value: "Well done" },
      });
      fireEvent.click(screen.getByText("Confirm"));

      expect(onApprove).toHaveBeenCalledWith("action-1", "Well done");
    });

    it("calls onApprove without note on One-Click Approve", () => {
      const onApprove = jest.fn();
      render(
        <ActionCard
          action={makeAction()}
          isGm
          onApprove={onApprove}
          onReject={jest.fn()}
        />
      );

      fireEvent.click(screen.getByLabelText("One-click approve"));

      expect(onApprove).toHaveBeenCalledWith("action-1");
    });

    it("shows feedback textarea on Reject click", () => {
      render(
        <ActionCard
          action={makeAction()}
          isGm
          onApprove={jest.fn()}
          onReject={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText("Reject"));

      expect(screen.getByPlaceholderText(/explain why/i)).toBeInTheDocument();
      expect(screen.getByText("Confirm Reject")).toBeInTheDocument();
    });

    it("disables Confirm Reject when feedback is empty", () => {
      render(
        <ActionCard
          action={makeAction()}
          isGm
          onApprove={jest.fn()}
          onReject={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText("Reject"));

      expect(screen.getByText("Confirm Reject")).toBeDisabled();
    });

    it("calls onReject with feedback on confirm", () => {
      const onReject = jest.fn();
      render(
        <ActionCard
          action={makeAction()}
          isGm
          onApprove={jest.fn()}
          onReject={onReject}
        />
      );

      fireEvent.click(screen.getByText("Reject"));
      fireEvent.change(screen.getByPlaceholderText(/explain why/i), {
        target: { value: "Too far away" },
      });
      fireEvent.click(screen.getByText("Confirm Reject"));

      expect(onReject).toHaveBeenCalledWith("action-1", "Too far away");
    });

    it("returns to default state on Cancel", () => {
      render(
        <ActionCard
          action={makeAction()}
          isGm
          onApprove={jest.fn()}
          onReject={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText("Validate"));
      expect(screen.getByText("Confirm")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Cancel"));
      expect(screen.getByText("Validate")).toBeInTheDocument();
    });
  });
});
