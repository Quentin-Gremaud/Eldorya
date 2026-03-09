import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { usePendingCharacters } from "../use-pending-characters";

const mockApiFetch = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
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

const mockPendingCharacters = [
  {
    id: "char-1",
    userId: "user-1",
    name: "Gandalf",
    race: "Human",
    characterClass: "Mage",
    background: "A wandering wizard",
    stats: { strength: 8, dexterity: 14, constitution: 12, intelligence: 18, wisdom: 16, charisma: 10 },
    spells: ["Fireball", "Shield"],
    status: "pending" as const,
    createdAt: "2026-03-01T12:00:00.000Z",
  },
];

describe("usePendingCharacters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch pending characters from correct endpoint", async () => {
    mockApiFetch.mockResolvedValue({ data: mockPendingCharacters });

    const { result } = renderHook(
      () => usePendingCharacters("campaign-456"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/campaign-456/characters/pending"
    );
    expect(result.current.pendingCharacters).toEqual(mockPendingCharacters);
  });

  it("should return empty array when no data", async () => {
    mockApiFetch.mockResolvedValue({ data: [] });

    const { result } = renderHook(
      () => usePendingCharacters("campaign-456"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.pendingCharacters).toEqual([]);
  });

  it("should handle error state", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(
      () => usePendingCharacters("campaign-456"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.pendingCharacters).toEqual([]);
  });
});
