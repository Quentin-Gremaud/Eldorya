import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { PendingCharactersList } from "../pending-characters-list";
import type { PendingCharacterDetail } from "@/types/api";

const mockApproveMutate = jest.fn();
const mockRejectMutate = jest.fn();

jest.mock("@/hooks/use-approve-character", () => ({
  useApproveCharacter: () => ({
    mutate: mockApproveMutate,
    isPending: false,
    variables: undefined,
  }),
}));

jest.mock("@/hooks/use-reject-character", () => ({
  useRejectCharacter: () => ({
    mutate: mockRejectMutate,
    isPending: false,
    variables: undefined,
  }),
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
      children
    );
  };
}

const mockCharacters: PendingCharacterDetail[] = [
  {
    id: "char-1",
    userId: "user-1",
    name: "Gandalf",
    race: "Human",
    characterClass: "Mage",
    background: "A wizard",
    stats: { strength: 8, dexterity: 14, constitution: 12, intelligence: 18, wisdom: 16, charisma: 10 },
    spells: ["Fireball"],
    status: "pending" as const,
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
    status: "pending" as const,
    createdAt: "2026-03-02T12:00:00.000Z",
  },
];

describe("PendingCharactersList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render list of pending characters", () => {
    render(
      <PendingCharactersList
        campaignId="campaign-1"
        characters={mockCharacters}
        isLoading={false}
        isError={false}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Gandalf")).toBeInTheDocument();
    expect(screen.getByText("Aragorn")).toBeInTheDocument();
  });

  it("should show empty state message", () => {
    render(
      <PendingCharactersList
        campaignId="campaign-1"
        characters={[]}
        isLoading={false}
        isError={false}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("No characters pending review.")).toBeInTheDocument();
  });

  it("should show loading skeletons", () => {
    render(
      <PendingCharactersList
        campaignId="campaign-1"
        characters={[]}
        isLoading={true}
        isError={false}
      />,
      { wrapper: createWrapper() }
    );

    expect(
      document.querySelectorAll("[data-slot='skeleton']").length
    ).toBeGreaterThan(0);
  });

  it("should show error message", () => {
    render(
      <PendingCharactersList
        campaignId="campaign-1"
        characters={[]}
        isLoading={false}
        isError={true}
      />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByText("Failed to load pending characters.")
    ).toBeInTheDocument();
  });
});
