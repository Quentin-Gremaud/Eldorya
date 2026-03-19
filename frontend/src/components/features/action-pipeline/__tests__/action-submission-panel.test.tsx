import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionSubmissionPanel } from "../action-submission-panel";

const mockMutate = jest.fn();
const mockCancelMutate = jest.fn();

jest.mock("@/hooks/use-propose-action", () => ({
  useProposeAction: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

jest.mock("@/hooks/use-cancel-action", () => ({
  useCancelAction: () => ({
    mutate: mockCancelMutate,
    isPending: false,
  }),
}));

const mockUsePipelineMode = jest.fn().mockReturnValue({
  pipelineMode: "optional",
  isLoading: false,
  isError: false,
});

jest.mock("@/hooks/use-pipeline-mode", () => ({
  usePipelineMode: (...args: unknown[]) => mockUsePipelineMode(...args),
}));

jest.mock("@/hooks/use-action-pipeline-web-socket", () => ({
  useActionPipelineWebSocket: jest.fn(),
}));

jest.mock("@/hooks/use-action-outcome-notification", () => ({
  useActionOutcomeNotification: () => ({
    outcome: null,
    onActionValidated: jest.fn(),
    onActionRejected: jest.fn(),
    clearOutcome: jest.fn(),
  }),
}));

// Mock crypto.randomUUID
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => "test-uuid-1234" },
});

describe("ActionSubmissionPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders ActionToolbar initially", () => {
    render(
      <ActionSubmissionPanel campaignId="campaign-1" sessionId="session-1" />
    );

    expect(screen.getByText("Your Action")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Describe your action...")
    ).toBeInTheDocument();
  });

  it("shows 'Waiting for GM' message after successful submit", async () => {
    mockMutate.mockImplementation((_payload: unknown, options: { onSuccess: () => void }) => {
      options.onSuccess();
    });

    render(
      <ActionSubmissionPanel campaignId="campaign-1" sessionId="session-1" />
    );

    const input = screen.getByPlaceholderText("Describe your action...");
    await userEvent.type(input, "I attack the dragon");
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(screen.getByText(/Waiting for GM/)).toBeInTheDocument();
  });

  it("cancel button is visible when waiting for GM", async () => {
    mockMutate.mockImplementation((_payload: unknown, options: { onSuccess: () => void }) => {
      options.onSuccess();
    });

    render(
      <ActionSubmissionPanel campaignId="campaign-1" sessionId="session-1" />
    );

    const input = screen.getByPlaceholderText("Describe your action...");
    await userEvent.type(input, "I attack the dragon");
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    // Should be in waiting state
    expect(screen.getByText(/Waiting for GM/)).toBeInTheDocument();

    // Cancel button should be visible
    expect(screen.getByRole("button", { name: "Cancel pending action" })).toBeInTheDocument();
  });

  it("cancel button calls useCancelAction on click", async () => {
    mockMutate.mockImplementation((_payload: unknown, options: { onSuccess: () => void }) => {
      options.onSuccess();
    });

    render(
      <ActionSubmissionPanel campaignId="campaign-1" sessionId="session-1" />
    );

    const input = screen.getByPlaceholderText("Describe your action...");
    await userEvent.type(input, "I attack the dragon");
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    // Click cancel
    await userEvent.click(screen.getByRole("button", { name: "Cancel pending action" }));

    expect(mockCancelMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: "campaign-1",
        sessionId: "session-1",
        actionId: "test-uuid-1234",
      }),
      expect.any(Object)
    );
  });

  it("calls proposeAction.mutate with correct payload", async () => {
    render(
      <ActionSubmissionPanel campaignId="campaign-1" sessionId="session-1" />
    );

    // Select attack type
    await userEvent.click(screen.getByRole("button", { name: "Attack" }));

    const input = screen.getByPlaceholderText("Describe your action...");
    await userEvent.type(input, "Slash with sword");
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: "campaign-1",
        sessionId: "session-1",
        actionId: "test-uuid-1234",
        actionType: "attack",
        description: "Slash with sword",
      }),
      expect.any(Object)
    );
  });

  describe("mandatory pipeline mode", () => {
    it("shows disabled state when mandatory and not pinged", () => {
      mockUsePipelineMode.mockReturnValue({
        pipelineMode: "mandatory",
        isLoading: false,
        isError: false,
      });

      render(
        <ActionSubmissionPanel campaignId="campaign-1" sessionId="session-1" isPinged={false} />
      );

      expect(
        screen.getByText("Waiting for The Master to signal your turn")
      ).toBeInTheDocument();

      const disabledContainer = screen.getByText("Waiting for The Master to signal your turn").closest("div");
      expect(disabledContainer).toHaveAttribute("aria-disabled", "true");
      expect(disabledContainer).toHaveClass("opacity-50", "cursor-not-allowed");
    });

    it("shows narrative message with aria-live when mandatory and not pinged", () => {
      mockUsePipelineMode.mockReturnValue({
        pipelineMode: "mandatory",
        isLoading: false,
        isError: false,
      });

      render(
        <ActionSubmissionPanel campaignId="campaign-1" sessionId="session-1" isPinged={false} />
      );

      const message = screen.getByText("Waiting for The Master to signal your turn");
      expect(message).toHaveAttribute("aria-live", "polite");
    });

    it("shows 'The Master awaits your action' when mandatory and pinged", () => {
      mockUsePipelineMode.mockReturnValue({
        pipelineMode: "mandatory",
        isLoading: false,
        isError: false,
      });

      render(
        <ActionSubmissionPanel campaignId="campaign-1" sessionId="session-1" isPinged={true} />
      );

      expect(
        screen.getByText("The Master awaits your action")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Describe your action...")
      ).toBeInTheDocument();
    });

    it("shows normal toolbar when pipeline mode is optional", () => {
      mockUsePipelineMode.mockReturnValue({
        pipelineMode: "optional",
        isLoading: false,
        isError: false,
      });

      render(
        <ActionSubmissionPanel campaignId="campaign-1" sessionId="session-1" isPinged={false} />
      );

      expect(
        screen.queryByText("Waiting for The Master to signal your turn")
      ).not.toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Describe your action...")
      ).toBeInTheDocument();
    });
  });
});
