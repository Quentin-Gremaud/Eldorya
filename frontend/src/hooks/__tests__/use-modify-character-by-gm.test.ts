import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useModifyCharacterByGm } from "../use-modify-character-by-gm";
import { toast } from "sonner";
import type { CharacterDetailForGm } from "@/types/api";

const mockApiFetch = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const CAMPAIGN_ID = "campaign-456";

function createWrapper(queryClient?: QueryClient) {
  const client =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe("useModifyCharacterByGm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiFetch.mockResolvedValue(undefined);
  });

  it("should call correct endpoint with PATCH method", async () => {
    const { result } = renderHook(
      () => useModifyCharacterByGm(CAMPAIGN_ID),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({
        characterId: "char-123",
        modifications: { name: "Gandalf the White" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/campaign-456/characters/char-123",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Gandalf the White" }),
      }
    );
  });

  it("should show success toast on modification", async () => {
    const { result } = renderHook(
      () => useModifyCharacterByGm(CAMPAIGN_ID),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({
        characterId: "char-123",
        modifications: { name: "Gandalf the White" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.success).toHaveBeenCalledWith("Character modified successfully");
  });

  it("should show error toast on failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(
      () => useModifyCharacterByGm(CAMPAIGN_ID),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({
        characterId: "char-123",
        modifications: { name: "Gandalf the White" },
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to modify character");
  });

  it("should optimistically update character in cache", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const character: CharacterDetailForGm = {
      id: "char-123",
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

    queryClient.setQueryData(
      ["campaigns", CAMPAIGN_ID, "characters", "char-123"],
      character
    );

    let resolveApi!: () => void;
    mockApiFetch.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveApi = resolve;
      })
    );

    const { result } = renderHook(
      () => useModifyCharacterByGm(CAMPAIGN_ID),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      result.current.mutate({
        characterId: "char-123",
        modifications: { name: "Gandalf the White" },
      });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<CharacterDetailForGm>([
        "campaigns",
        CAMPAIGN_ID,
        "characters",
        "char-123",
      ]);
      expect(cached?.name).toBe("Gandalf the White");
    });

    await act(async () => {
      resolveApi();
    });
  });

  it("should rollback optimistic update on error", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const character: CharacterDetailForGm = {
      id: "char-123",
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

    queryClient.setQueryData(
      ["campaigns", CAMPAIGN_ID, "characters", "char-123"],
      character
    );

    mockApiFetch.mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(
      () => useModifyCharacterByGm(CAMPAIGN_ID),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      result.current.mutate({
        characterId: "char-123",
        modifications: { name: "Gandalf the White" },
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData<CharacterDetailForGm>([
      "campaigns",
      CAMPAIGN_ID,
      "characters",
      "char-123",
    ]);
    expect(cached?.name).toBe("Gandalf");
  });
});
