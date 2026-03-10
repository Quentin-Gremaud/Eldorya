import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CHARACTER_TEMPLATES } from "@/data/character-templates";

const mockUseMyCharacter = jest.fn();
const mockMutate = jest.fn();

jest.mock("@/hooks/use-my-character", () => ({
  useMyCharacter: (...args: unknown[]) => mockUseMyCharacter(...args),
}));

jest.mock("@/hooks/use-create-character", () => ({
  useCreateCharacter: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/hooks/use-campaign", () => ({
  useCampaign: () => ({
    campaign: { name: "Test Campaign" },
    isLoading: false,
    isError: false,
  }),
}));

jest.mock("@/hooks/use-request-character-modification", () => ({
  useRequestCharacterModification: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

// Import after mocks
import { PlayerCharacterContent } from "../page";

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
      createElement(TooltipProvider, null, children)
    );
  };
}

describe("PlayerCharacterPage integration", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show loading skeleton", () => {
    mockUseMyCharacter.mockReturnValue({
      character: null,
      isLoading: true,
      isError: false,
    });

    render(<PlayerCharacterContent campaignId="campaign-1" />, {
      wrapper: createWrapper(),
    });

    // Skeleton cards for template picker
    expect(document.querySelectorAll("[data-slot='skeleton']").length).toBeGreaterThan(0);
  });

  it("should show template picker when no character exists", () => {
    mockUseMyCharacter.mockReturnValue({
      character: null,
      isLoading: false,
      isError: false,
    });

    render(<PlayerCharacterContent campaignId="campaign-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Choose Your Character")).toBeInTheDocument();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    for (const template of CHARACTER_TEMPLATES) {
      expect(screen.getByText(template.name)).toBeInTheDocument();
    }
    expect(screen.getByText("Start from Scratch")).toBeInTheDocument();
  });

  it("should show CharacterSheet when character exists", () => {
    mockUseMyCharacter.mockReturnValue({
      character: {
        id: "char-1",
        name: "Gandalf",
        race: "Human",
        characterClass: "Mage",
        background: "Wizard",
        stats: { strength: 8, dexterity: 14, constitution: 12, intelligence: 18, wisdom: 16, charisma: 10 },
        spells: ["Fireball"],
        status: "pending",
        proposedChanges: null,
        createdAt: "2026-03-01T12:00:00.000Z",
      },
      isLoading: false,
      isError: false,
    });

    render(<PlayerCharacterContent campaignId="campaign-1" />, {
      wrapper: createWrapper(),
    });

    // Should NOT show template picker
    expect(screen.queryByText("Choose Your Character")).toBeNull();
    // Should show character sheet (the name should appear)
    expect(screen.getByText("Gandalf")).toBeInTheDocument();
  });

  it("should transition to form with pre-filled values when selecting a template", async () => {
    mockUseMyCharacter.mockReturnValue({
      character: null,
      isLoading: false,
      isError: false,
    });

    render(<PlayerCharacterContent campaignId="campaign-1" />, {
      wrapper: createWrapper(),
    });

    // Click the first template's Select button
    const selectButtons = screen.getAllByText("Select");
    await user.click(selectButtons[0]);

    // Should now show the form
    await waitFor(() => {
      expect(screen.getByText("Create Your Character")).toBeInTheDocument();
    });

    // Form should be pre-filled with template values
    const warrior = CHARACTER_TEMPLATES[0];
    const nameInput = screen.getByLabelText("Name") as HTMLInputElement;
    expect(nameInput.value).toBe(warrior.name);

    const strengthInput = screen.getByLabelText("strength") as HTMLInputElement;
    expect(strengthInput.value).toBe(String(warrior.stats.strength));
  });

  it("should transition to empty form when clicking Start from Scratch", async () => {
    mockUseMyCharacter.mockReturnValue({
      character: null,
      isLoading: false,
      isError: false,
    });

    render(<PlayerCharacterContent campaignId="campaign-1" />, {
      wrapper: createWrapper(),
    });

    // Click the "Start from Scratch" card
    const scratchCard = screen.getByRole("option", { name: /Start from Scratch/ });
    await user.click(scratchCard);

    // Should now show the form
    await waitFor(() => {
      expect(screen.getByText("Create Your Character")).toBeInTheDocument();
    });

    // Form should have default values (empty name, stats at 10)
    const nameInput = screen.getByLabelText("Name") as HTMLInputElement;
    expect(nameInput.value).toBe("");

    const strengthInput = screen.getByLabelText("strength") as HTMLInputElement;
    expect(strengthInput.value).toBe("10");
  });

  it("should return to template picker when clicking Back to templates", async () => {
    mockUseMyCharacter.mockReturnValue({
      character: null,
      isLoading: false,
      isError: false,
    });

    render(<PlayerCharacterContent campaignId="campaign-1" />, {
      wrapper: createWrapper(),
    });

    // Go to form first
    const scratchCard = screen.getByRole("option", { name: /Start from Scratch/ });
    await user.click(scratchCard);

    await waitFor(() => {
      expect(screen.getByText("Create Your Character")).toBeInTheDocument();
    });

    // Click back to templates
    const backButton = screen.getByText("Back to templates");
    await user.click(backButton);

    // Should show template picker again
    await waitFor(() => {
      expect(screen.getByText("Choose Your Character")).toBeInTheDocument();
    });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("should show error state when character loading fails", () => {
    mockUseMyCharacter.mockReturnValue({
      character: null,
      isLoading: false,
      isError: true,
    });

    render(<PlayerCharacterContent campaignId="campaign-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Failed to load character data")).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("renders breadcrumb with Dashboard, Campaign, and Character", () => {
    mockUseMyCharacter.mockReturnValue({
      character: null,
      isLoading: false,
      isError: false,
    });

    render(<PlayerCharacterContent campaignId="campaign-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByLabelText("breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Test Campaign" })).toHaveAttribute("href", "/campaign/campaign-1/player");
  });

  it("renders back button linking to player hub", () => {
    mockUseMyCharacter.mockReturnValue({
      character: null,
      isLoading: false,
      isError: false,
    });

    render(<PlayerCharacterContent campaignId="campaign-1" />, {
      wrapper: createWrapper(),
    });

    const backButton = screen.getByLabelText("Go back");
    expect(backButton).toHaveAttribute("href", "/campaign/campaign-1/player");
  });

  describe("rejection resubmission flow", () => {
    const rejectedCharacter = {
      id: "char-1",
      name: "Gandalf",
      race: "Human",
      characterClass: "Mage",
      background: "Wizard",
      stats: { strength: 8, dexterity: 14, constitution: 12, intelligence: 18, wisdom: 16, charisma: 10 },
      spells: ["Fireball"],
      status: "rejected" as const,
      rejectionReason: "Stats are too high for a starting character",
      proposedChanges: null,
      createdAt: "2026-03-01T12:00:00.000Z",
    };

    it("should show rejection feedback when character is rejected with reason", () => {
      mockUseMyCharacter.mockReturnValue({
        character: rejectedCharacter,
        isLoading: false,
        isError: false,
      });

      render(<PlayerCharacterContent campaignId="campaign-1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText("Rejection Feedback from GM")).toBeInTheDocument();
      expect(
        screen.getByText("Stats are too high for a starting character")
      ).toBeInTheDocument();
    });

    it("should show Edit & Resubmit button when character is rejected", () => {
      mockUseMyCharacter.mockReturnValue({
        character: rejectedCharacter,
        isLoading: false,
        isError: false,
      });

      render(<PlayerCharacterContent campaignId="campaign-1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText("Edit & Resubmit")).toBeInTheDocument();
    });

    it("should transition to form with pre-filled values when clicking Edit & Resubmit", async () => {
      mockUseMyCharacter.mockReturnValue({
        character: rejectedCharacter,
        isLoading: false,
        isError: false,
      });

      render(<PlayerCharacterContent campaignId="campaign-1" />, {
        wrapper: createWrapper(),
      });

      const resubmitButton = screen.getByText("Edit & Resubmit");
      await user.click(resubmitButton);

      await waitFor(() => {
        expect(screen.getByText("Create Your Character")).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText("Name") as HTMLInputElement;
      expect(nameInput.value).toBe("Gandalf");

      const strengthInput = screen.getByLabelText("strength") as HTMLInputElement;
      expect(strengthInput.value).toBe("8");
    });

    it("should return to character sheet when clicking Back to character sheet", async () => {
      mockUseMyCharacter.mockReturnValue({
        character: rejectedCharacter,
        isLoading: false,
        isError: false,
      });

      render(<PlayerCharacterContent campaignId="campaign-1" />, {
        wrapper: createWrapper(),
      });

      // Go to resubmit form
      await user.click(screen.getByText("Edit & Resubmit"));

      await waitFor(() => {
        expect(screen.getByText("Create Your Character")).toBeInTheDocument();
      });

      // Click back
      await user.click(screen.getByText("Back to character sheet"));

      await waitFor(() => {
        expect(screen.getByText("Gandalf")).toBeInTheDocument();
      });

      expect(screen.getByText("Edit & Resubmit")).toBeInTheDocument();
    });
  });
});
