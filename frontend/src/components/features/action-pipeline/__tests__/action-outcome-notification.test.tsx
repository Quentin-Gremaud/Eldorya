import { render, screen, fireEvent } from "@testing-library/react";
import { ActionOutcomeNotification } from "../action-outcome-notification";
import type { ActionOutcome } from "@/types/api";

describe("ActionOutcomeNotification", () => {
  const validatedOutcome: ActionOutcome = {
    actionId: "a1",
    status: "validated",
    narrativeNote: "The path opens before you",
    resolvedAt: new Date().toISOString(),
  };

  const rejectedOutcome: ActionOutcome = {
    actionId: "a1",
    status: "rejected",
    feedback: "The dragon is too far away",
    resolvedAt: new Date().toISOString(),
  };

  it("renders validated outcome with narrative note", () => {
    render(
      <ActionOutcomeNotification
        outcome={validatedOutcome}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.getByText("Action Approved")).toBeInTheDocument();
    expect(
      screen.getByText(/The path opens before you/)
    ).toBeInTheDocument();
  });

  it("renders rejected outcome with feedback", () => {
    render(
      <ActionOutcomeNotification
        outcome={rejectedOutcome}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.getByText("Action Rejected")).toBeInTheDocument();
    expect(
      screen.getByText("The dragon is too far away")
    ).toBeInTheDocument();
  });

  it("renders validated outcome without narrative note", () => {
    const outcome: ActionOutcome = {
      ...validatedOutcome,
      narrativeNote: null,
    };
    render(
      <ActionOutcomeNotification outcome={outcome} onDismiss={jest.fn()} />
    );

    expect(screen.getByText("Action Approved")).toBeInTheDocument();
    expect(screen.queryByText(/"/)).not.toBeInTheDocument();
  });

  it("calls onDismiss when dismiss button clicked", () => {
    const onDismiss = jest.fn();
    render(
      <ActionOutcomeNotification
        outcome={validatedOutcome}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByLabelText("Dismiss notification"));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("has role=status for accessibility", () => {
    render(
      <ActionOutcomeNotification
        outcome={validatedOutcome}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("uses emerald styling for validated outcome", () => {
    const { container } = render(
      <ActionOutcomeNotification
        outcome={validatedOutcome}
        onDismiss={jest.fn()}
      />
    );

    expect(container.firstChild).toHaveClass("border-emerald-500");
  });

  it("uses red styling for rejected outcome", () => {
    const { container } = render(
      <ActionOutcomeNotification
        outcome={rejectedOutcome}
        onDismiss={jest.fn()}
      />
    );

    expect(container.firstChild).toHaveClass("border-red-500");
  });
});
