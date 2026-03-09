import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useApproveCharacter } from "../use-approve-character";
import { toast } from "sonner";
import type { PendingCharacterDetail } from "@/types/api";

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
const QUERY_KEY = ["campaigns", CAMPAIGN_ID, "characters", "pending"];

const makePendingCharacter = (
  overrides: Partial<PendingCharacterDetail> = {}
): PendingCharacterDetail => ({
  id: "char-123",
  userId: "user-1",
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
  spells: ["Fireball"],
  status: "pending",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

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
    return createElement(
      QueryClientProvider,
      { client },
      children
    );
  };
}

describe("useApproveCharacter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiFetch.mockResolvedValue(undefined);
  });

  it("should call correct endpoint with POST method", async () => {
    const { result } = renderHook(
      () => useApproveCharacter(CAMPAIGN_ID),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate("char-123");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/campaign-456/characters/char-123/approve",
      {
        method: "POST",
      }
    );
  });

  it("should handle error state", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(
      () => useApproveCharacter(CAMPAIGN_ID),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate("char-123");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("should be idle initially", () => {
    const { result } = renderHook(
      () => useApproveCharacter(CAMPAIGN_ID),
      { wrapper: createWrapper() }
    );

    expect(result.current.isIdle).toBe(true);
    expect(result.current.isPending).toBe(false);
  });

  // M9: Toast assertions
  it("should show success toast on approval", async () => {
    const { result } = renderHook(
      () => useApproveCharacter(CAMPAIGN_ID),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate("char-123");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.success).toHaveBeenCalledWith("Character approved!");
  });

  it("should show error toast on failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(
      () => useApproveCharacter(CAMPAIGN_ID),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate("char-123");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to approve character");
  });

  // M10: Optimistic update tests
  it("should optimistically remove approved character from cache", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const char1 = makePendingCharacter({ id: "char-1" });
    const char2 = makePendingCharacter({ id: "char-2", name: "Frodo" });
    queryClient.setQueryData(QUERY_KEY, [char1, char2]);

    // Make the API call hang so we can inspect the optimistic state
    let resolveApi!: () => void;
    mockApiFetch.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveApi = resolve;
      })
    );

    const { result } = renderHook(
      () => useApproveCharacter(CAMPAIGN_ID),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      result.current.mutate("char-1");
    });

    // After onMutate, char-1 should be removed optimistically
    await waitFor(() => {
      const cached = queryClient.getQueryData<PendingCharacterDetail[]>(QUERY_KEY);
      expect(cached).toHaveLength(1);
      expect(cached![0].id).toBe("char-2");
    });

    // Resolve the API call
    await act(async () => {
      resolveApi();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("should rollback optimistic update on error", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const char1 = makePendingCharacter({ id: "char-1" });
    const char2 = makePendingCharacter({ id: "char-2", name: "Frodo" });
    queryClient.setQueryData(QUERY_KEY, [char1, char2]);

    mockApiFetch.mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(
      () => useApproveCharacter(CAMPAIGN_ID),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      result.current.mutate("char-1");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Cache should be restored with both characters
    const cached = queryClient.getQueryData<PendingCharacterDetail[]>(QUERY_KEY);
    expect(cached).toHaveLength(2);
    expect(cached!.map((c) => c.id)).toEqual(["char-1", "char-2"]);
  });
});
