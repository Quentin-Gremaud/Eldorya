import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { GMCharacterModificationDialog } from "../gm-character-modification-dialog";
import type { CharacterSummary } from "@/types/api";

const mockMutate = jest.fn();

jest.mock("@/hooks/use-modify-character-by-gm", () => ({
  useModifyCharacterByGm: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const mockCharacter: CharacterSummary = {
  id: "char-1",
  userId: "user-1",
  name: "Gandalf",
  race: "Human",
  characterClass: "Mage",
  background: "A wizard",
  stats: { strength: 8, dexterity: 14, constitution: 12, intelligence: 18, wisdom: 16, charisma: 10 },
  spells: ["Fireball"],
  status: "approved",
  createdAt: "2026-03-01T12:00:00.000Z",
};

describe("GMCharacterModificationDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render pre-filled form when open", () => {
    render(
      <GMCharacterModificationDialog
        campaignId="campaign-1"
        character={mockCharacter}
        open={true}
        onOpenChange={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Modify Character: Gandalf")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Gandalf")).toBeInTheDocument();
    expect(screen.getByDisplayValue("A wizard")).toBeInTheDocument();
  });

  it("should render Save Changes and Cancel buttons", () => {
    render(
      <GMCharacterModificationDialog
        campaignId="campaign-1"
        character={mockCharacter}
        open={true}
        onOpenChange={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Save Changes")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("should call onOpenChange when Cancel is clicked", () => {
    const onOpenChange = jest.fn();
    render(
      <GMCharacterModificationDialog
        campaignId="campaign-1"
        character={mockCharacter}
        open={true}
        onOpenChange={onOpenChange}
      />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should not render when closed", () => {
    render(
      <GMCharacterModificationDialog
        campaignId="campaign-1"
        character={mockCharacter}
        open={false}
        onOpenChange={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText("Modify Character: Gandalf")).toBeFalsy();
  });
});
