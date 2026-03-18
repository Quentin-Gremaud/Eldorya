import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionSubmissionPanel } from "../action-submission-panel";

const mockMutate = jest.fn();

jest.mock("@/hooks/use-propose-action", () => ({
  useProposeAction: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
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

  it("'Submit another action' button resets to toolbar", async () => {
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

    // Click "Submit another action"
    fireEvent.click(screen.getByText("Submit another action"));

    // Should be back to toolbar
    expect(screen.getByText("Your Action")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Describe your action...")
    ).toBeInTheDocument();
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
});
