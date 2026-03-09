import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterModificationReviewCard } from "../character-modification-review-card";
import type { PendingModification } from "@/hooks/use-pending-modifications";

const modification: PendingModification = {
  id: "char-1",
  userId: "player-1",
  name: "Thorin",
  race: "Dwarf",
  characterClass: "Warrior",
  background: "Noble",
  stats: {
    strength: 14,
    dexterity: 10,
    constitution: 16,
    intelligence: 10,
    wisdom: 12,
    charisma: 8,
  },
  spells: [],
  status: "pending_revalidation",
  proposedChanges: {
    name: { current: "Thorin", proposed: "Thorin II" },
    race: { current: "Dwarf", proposed: "Half-Elf" },
  },
  createdAt: "2026-03-01T00:00:00Z",
};

describe("CharacterModificationReviewCard", () => {
  const onApprove = jest.fn();
  const onReject = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render character name and modification badge", () => {
    render(
      <CharacterModificationReviewCard
        modification={modification}
        onApprove={onApprove}
        onReject={onReject}
        isApproving={false}
        isRejecting={false}
      />
    );

    expect(screen.getAllByText("Thorin").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Modification Request")).toBeInTheDocument();
  });

  it("should display proposed changes with current and proposed values", () => {
    render(
      <CharacterModificationReviewCard
        modification={modification}
        onApprove={onApprove}
        onReject={onReject}
        isApproving={false}
        isRejecting={false}
      />
    );

    expect(screen.getByText("Thorin II")).toBeInTheDocument();
    expect(screen.getByText("Half-Elf")).toBeInTheDocument();
  });

  it("should call onApprove when Approve Changes is clicked", async () => {
    const user = userEvent.setup();

    render(
      <CharacterModificationReviewCard
        modification={modification}
        onApprove={onApprove}
        onReject={onReject}
        isApproving={false}
        isRejecting={false}
      />
    );

    await user.click(screen.getByText("Approve Changes"));

    expect(onApprove).toHaveBeenCalledWith("char-1");
  });

  it("should show rejection form when Reject is clicked", async () => {
    const user = userEvent.setup();

    render(
      <CharacterModificationReviewCard
        modification={modification}
        onApprove={onApprove}
        onReject={onReject}
        isApproving={false}
        isRejecting={false}
      />
    );

    await user.click(screen.getByText("Reject"));

    expect(
      screen.getByPlaceholderText(
        "Explain why these changes are rejected..."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Confirm Rejection")).toBeInTheDocument();
  });

  it("should call onReject with reason when confirming rejection", async () => {
    const user = userEvent.setup();

    render(
      <CharacterModificationReviewCard
        modification={modification}
        onApprove={onApprove}
        onReject={onReject}
        isApproving={false}
        isRejecting={false}
      />
    );

    await user.click(screen.getByText("Reject"));
    await user.type(
      screen.getByPlaceholderText(
        "Explain why these changes are rejected..."
      ),
      "Name changes not allowed"
    );
    await user.click(screen.getByText("Confirm Rejection"));

    expect(onReject).toHaveBeenCalledWith("char-1", "Name changes not allowed");
  });
});
