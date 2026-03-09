import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { CampaignCharactersList } from "../campaign-characters-list";

const mockUseCampaignCharacters = jest.fn();

jest.mock("@/hooks/use-campaign-characters", () => ({
  useCampaignCharacters: (...args: unknown[]) => mockUseCampaignCharacters(...args),
}));

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

const mockCharacters = [
  {
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
  },
  {
    id: "char-2",
    userId: "user-2",
    name: "Aragorn",
    race: "Human",
    characterClass: "Warrior",
    background: "A ranger",
    stats: { strength: 16, dexterity: 14, constitution: 14, intelligence: 10, wisdom: 12, charisma: 14 },
    spells: [],
    status: "approved",
    createdAt: "2026-03-02T12:00:00.000Z",
  },
];

describe("CampaignCharactersList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render list of characters", () => {
    mockUseCampaignCharacters.mockReturnValue({
      characters: mockCharacters,
      isLoading: false,
      isError: false,
    });

    render(
      <CampaignCharactersList campaignId="campaign-1" />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Gandalf")).toBeInTheDocument();
    expect(screen.getByText("Aragorn")).toBeInTheDocument();
  });

  it("should show empty state", () => {
    mockUseCampaignCharacters.mockReturnValue({
      characters: [],
      isLoading: false,
      isError: false,
    });

    render(
      <CampaignCharactersList campaignId="campaign-1" />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByText("No approved characters in this campaign")
    ).toBeInTheDocument();
  });

  it("should show loading skeletons", () => {
    mockUseCampaignCharacters.mockReturnValue({
      characters: [],
      isLoading: true,
      isError: false,
    });

    render(
      <CampaignCharactersList campaignId="campaign-1" />,
      { wrapper: createWrapper() }
    );

    expect(
      document.querySelectorAll("[data-slot='skeleton']").length
    ).toBeGreaterThan(0);
  });

  it("should show error message", () => {
    mockUseCampaignCharacters.mockReturnValue({
      characters: [],
      isLoading: false,
      isError: true,
    });

    render(
      <CampaignCharactersList campaignId="campaign-1" />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByText("Failed to load characters. Please try again.")
    ).toBeInTheDocument();
  });
});
