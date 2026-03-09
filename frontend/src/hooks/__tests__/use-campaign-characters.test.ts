import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useCampaignCharacters } from "../use-campaign-characters";

const mockApiFetch = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useCampaignCharacters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return loading state initially", () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCampaignCharacters("campaign-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.characters).toEqual([]);
  });

  it("should return characters on success", async () => {
    const characters = [
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
    ];

    mockApiFetch.mockResolvedValue({ data: characters });

    const { result } = renderHook(() => useCampaignCharacters("campaign-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.characters).toEqual(characters);
  });

  it("should handle error state", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCampaignCharacters("campaign-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("should return empty array when no characters", async () => {
    mockApiFetch.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useCampaignCharacters("campaign-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.characters).toEqual([]);
  });
});
