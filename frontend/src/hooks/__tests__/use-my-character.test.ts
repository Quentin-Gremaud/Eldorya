import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useMyCharacter } from "../use-my-character";

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

describe("useMyCharacter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return loading state initially", () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useMyCharacter("campaign-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.character).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it("should return character on success", async () => {
    const character = {
      id: "char-123",
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
      status: "pending",
      createdAt: "2026-03-01T12:00:00.000Z",
    };

    mockApiFetch.mockResolvedValue({ data: character });

    const { result } = renderHook(() => useMyCharacter("campaign-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.character).toEqual(character);
    expect(result.current.isError).toBe(false);
  });

  it("should return null when 404 (no character)", async () => {
    mockApiFetch.mockRejectedValue({ statusCode: 404 });

    const { result } = renderHook(() => useMyCharacter("campaign-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.character).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it("should handle error state for non-404 errors", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useMyCharacter("campaign-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("should call API with correct endpoint", async () => {
    mockApiFetch.mockResolvedValue({ data: null });

    renderHook(() => useMyCharacter("campaign-xyz"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/campaigns/campaign-xyz/characters/me"
      );
    });
  });
});
