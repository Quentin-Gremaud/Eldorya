import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CharacterForm } from "../character-form";

const mockMutate = jest.fn();

jest.mock("@/hooks/use-create-character", () => ({
  useCreateCharacter: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

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

describe("CharacterForm", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the form with all fields", () => {
    render(
      <CharacterForm campaignId="campaign-1" onSuccess={jest.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Create Your Character")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByText("Race")).toBeInTheDocument();
    expect(screen.getByText("Class")).toBeInTheDocument();
    expect(screen.getByLabelText("Background")).toBeInTheDocument();
    expect(screen.getByText("Statistics")).toBeInTheDocument();
    expect(screen.getByText("Submit Character for Approval")).toBeInTheDocument();
  });

  it("should render stat inputs with default value 10", () => {
    render(
      <CharacterForm campaignId="campaign-1" onSuccess={jest.fn()} />,
      { wrapper: createWrapper() }
    );

    const strengthInput = screen.getByLabelText("strength");
    expect((strengthInput as HTMLInputElement).value).toBe("10");
  });

  it("should render Add Spell button", () => {
    render(
      <CharacterForm campaignId="campaign-1" onSuccess={jest.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Add Spell")).toBeInTheDocument();
  });

  it("should show validation error for empty name on submit", async () => {
    render(
      <CharacterForm campaignId="campaign-1" onSuccess={jest.fn()} />,
      { wrapper: createWrapper() }
    );

    const submitButton = screen.getByText("Submit Character for Approval");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Character name is required")).toBeInTheDocument();
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("should add a spell field when clicking Add Spell", async () => {
    render(
      <CharacterForm campaignId="campaign-1" onSuccess={jest.fn()} />,
      { wrapper: createWrapper() }
    );

    const addButton = screen.getByText("Add Spell");
    await user.click(addButton);

    expect(screen.getByPlaceholderText("Spell 1")).toBeInTheDocument();
  });

  describe("with initialValues (template)", () => {
    const templateValues = {
      name: "Fearless Warrior",
      race: "Human" as const,
      characterClass: "Warrior" as const,
      background: "Trained in the royal guard since childhood.",
      stats: {
        strength: 16,
        dexterity: 12,
        constitution: 14,
        intelligence: 8,
        wisdom: 10,
        charisma: 12,
      },
      spells: [{ value: "Shield Bash" }, { value: "War Cry" }],
    };

    it("should pre-fill name from template", () => {
      render(
        <CharacterForm
          campaignId="campaign-1"
          onSuccess={jest.fn()}
          initialValues={templateValues}
        />,
        { wrapper: createWrapper() }
      );

      const nameInput = screen.getByLabelText("Name") as HTMLInputElement;
      expect(nameInput.value).toBe("Fearless Warrior");
    });

    it("should pre-fill stats from template", () => {
      render(
        <CharacterForm
          campaignId="campaign-1"
          onSuccess={jest.fn()}
          initialValues={templateValues}
        />,
        { wrapper: createWrapper() }
      );

      const strengthInput = screen.getByLabelText("strength") as HTMLInputElement;
      expect(strengthInput.value).toBe("16");

      const dexInput = screen.getByLabelText("dexterity") as HTMLInputElement;
      expect(dexInput.value).toBe("12");
    });

    it("should pre-fill background from template", () => {
      render(
        <CharacterForm
          campaignId="campaign-1"
          onSuccess={jest.fn()}
          initialValues={templateValues}
        />,
        { wrapper: createWrapper() }
      );

      const bgInput = screen.getByLabelText("Background") as HTMLInputElement;
      expect(bgInput.value).toBe("Trained in the royal guard since childhood.");
    });

    it("should pre-fill spells from template", () => {
      render(
        <CharacterForm
          campaignId="campaign-1"
          onSuccess={jest.fn()}
          initialValues={templateValues}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByDisplayValue("Shield Bash")).toBeInTheDocument();
      expect(screen.getByDisplayValue("War Cry")).toBeInTheDocument();
    });

    it("should allow editing pre-filled fields", async () => {
      render(
        <CharacterForm
          campaignId="campaign-1"
          onSuccess={jest.fn()}
          initialValues={templateValues}
        />,
        { wrapper: createWrapper() }
      );

      const nameInput = screen.getByLabelText("Name") as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, "Modified Name");
      expect(nameInput.value).toBe("Modified Name");
    });
  });
});
