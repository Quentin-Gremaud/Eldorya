import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { GMCharacterCard } from "../gm-character-card";
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
  spells: ["Fireball", "Shield"],
  status: "approved",
  createdAt: "2026-03-01T12:00:00.000Z",
};

describe("GMCharacterCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render character data", () => {
    render(
      <GMCharacterCard campaignId="campaign-1" character={mockCharacter} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Gandalf")).toBeInTheDocument();
    expect(screen.getByText("Human")).toBeInTheDocument();
    expect(screen.getByText("Mage")).toBeInTheDocument();
    expect(screen.getByText("Fireball")).toBeInTheDocument();
    expect(screen.getByText("Shield")).toBeInTheDocument();
  });

  it("should render stat block grid", () => {
    render(
      <GMCharacterCard campaignId="campaign-1" character={mockCharacter} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("STR")).toBeInTheDocument();
    expect(screen.getByText("INT")).toBeInTheDocument();
  });

  it("should have a Modify button", () => {
    render(
      <GMCharacterCard campaignId="campaign-1" character={mockCharacter} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Modify")).toBeInTheDocument();
  });

  it("should open dialog when Modify is clicked", () => {
    render(
      <GMCharacterCard campaignId="campaign-1" character={mockCharacter} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("Modify"));

    expect(screen.getByText(`Modify Character: Gandalf`)).toBeInTheDocument();
  });
});
