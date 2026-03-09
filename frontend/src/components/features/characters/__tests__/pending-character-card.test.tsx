import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { PendingCharacterCard } from "../pending-character-card";
import type { PendingCharacterDetail } from "@/types/api";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

const mockCharacter: PendingCharacterDetail = {
  id: "char-123",
  userId: "user-player-1",
  name: "Gandalf",
  race: "Human",
  characterClass: "Mage",
  background: "A wandering wizard",
  stats: {
    strength: 8,
    dexterity: 14,
    constitution: 12,
    intelligence: 18,
    wisdom: 16,
    charisma: 10,
  },
  spells: ["Fireball", "Shield"],
  status: "pending" as const,
  createdAt: "2026-03-01T12:00:00.000Z",
};

describe("PendingCharacterCard", () => {
  const user = userEvent.setup();
  const defaultProps = {
    character: mockCharacter,
    onApprove: jest.fn(),
    onReject: jest.fn(),
    isApproving: false,
    isRejecting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render character name, race, class, stats, and spells", () => {
    render(<PendingCharacterCard {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Gandalf")).toBeInTheDocument();
    expect(screen.getByText("Human")).toBeInTheDocument();
    expect(screen.getByText("Mage")).toBeInTheDocument();

    // Stats labels
    expect(screen.getByText("STR")).toBeInTheDocument();
    expect(screen.getByText("DEX")).toBeInTheDocument();
    expect(screen.getByText("CON")).toBeInTheDocument();
    expect(screen.getByText("INT")).toBeInTheDocument();
    expect(screen.getByText("WIS")).toBeInTheDocument();
    expect(screen.getByText("CHA")).toBeInTheDocument();

    // Stat values
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();

    // Spells
    expect(screen.getByText("Fireball")).toBeInTheDocument();
    expect(screen.getByText("Shield")).toBeInTheDocument();
  });

  it("should call onApprove with characterId when clicking Approve", async () => {
    const onApprove = jest.fn();
    render(
      <PendingCharacterCard {...defaultProps} onApprove={onApprove} />,
      { wrapper: createWrapper() }
    );

    const approveButton = screen.getByLabelText("Approve Gandalf");
    await user.click(approveButton);

    expect(onApprove).toHaveBeenCalledWith("char-123");
  });

  it("should show textarea for reason when clicking Reject", async () => {
    render(<PendingCharacterCard {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    const rejectButton = screen.getByLabelText("Reject Gandalf");
    await user.click(rejectButton);

    await waitFor(() => {
      expect(screen.getByLabelText("Rejection reason")).toBeInTheDocument();
    });

    expect(screen.getByText("Confirm Rejection")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("should call onReject with characterId and reason when submitting rejection", async () => {
    const onReject = jest.fn();
    render(
      <PendingCharacterCard {...defaultProps} onReject={onReject} />,
      { wrapper: createWrapper() }
    );

    // Open reject form
    const rejectButton = screen.getByLabelText("Reject Gandalf");
    await user.click(rejectButton);

    // Type reason
    const textarea = screen.getByLabelText("Rejection reason");
    await user.type(textarea, "Stats are too high for a level 1 character");

    // Confirm rejection
    const confirmButton = screen.getByLabelText("Confirm rejection of Gandalf");
    await user.click(confirmButton);

    expect(onReject).toHaveBeenCalledWith(
      "char-123",
      "Stats are too high for a level 1 character"
    );
  });

  it("should disable buttons when isApproving is true", () => {
    render(
      <PendingCharacterCard {...defaultProps} isApproving={true} />,
      { wrapper: createWrapper() }
    );

    const approveButton = screen.getByLabelText("Approve Gandalf");
    expect((approveButton as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Approving...")).toBeInTheDocument();

    const rejectButton = screen.getByLabelText("Reject Gandalf");
    expect((rejectButton as HTMLButtonElement).disabled).toBe(true);
  });

  it("should disable buttons when isRejecting is true", () => {
    render(
      <PendingCharacterCard {...defaultProps} isRejecting={true} />,
      { wrapper: createWrapper() }
    );

    const approveButton = screen.getByLabelText("Approve Gandalf");
    expect((approveButton as HTMLButtonElement).disabled).toBe(true);

    const rejectButton = screen.getByLabelText("Reject Gandalf");
    expect((rejectButton as HTMLButtonElement).disabled).toBe(true);
  });

  it("should hide reject form when clicking Cancel", async () => {
    render(<PendingCharacterCard {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    // Open reject form
    const rejectButton = screen.getByLabelText("Reject Gandalf");
    await user.click(rejectButton);

    expect(screen.getByLabelText("Rejection reason")).toBeInTheDocument();

    // Click Cancel
    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    // Reject form should be hidden
    await waitFor(() => {
      expect(screen.queryByLabelText("Rejection reason")).toBeNull();
    });

    // Original Reject button should be back
    expect(screen.getByLabelText("Reject Gandalf")).toBeInTheDocument();
  });
});
