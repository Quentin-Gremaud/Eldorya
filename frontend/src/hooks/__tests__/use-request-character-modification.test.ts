import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useRequestCharacterModification } from "../use-request-character-modification";
import { toast } from "sonner";
import type { CharacterDetail } from "@/types/api";

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

const CAMPAIGN_ID = "campaign-1";
const CHARACTER_ID = "char-1";
const QUERY_KEY = ["campaigns", CAMPAIGN_ID, "characters", "me"];

const makeCharacter = (): CharacterDetail => ({
  id: CHARACTER_ID,
  name: "Thorin",
  race: "Dwarf",
  characterClass: "Warrior",
  background: "Noble",
  stats: {
    strength: 14,
    dexterity: 10,
    constitution: 16,
    intelligence: 10,
    wisdom: 12,
    charisma: 8,
  },
  spells: [],
  status: "approved",
  rejectionReason: null,
  proposedChanges: null,
  createdAt: "2026-03-01T00:00:00Z",
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
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe("useRequestCharacterModification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiFetch.mockResolvedValue(undefined);
  });

  it("should call correct endpoint with POST", async () => {
    const { result } = renderHook(
      () => useRequestCharacterModification(CAMPAIGN_ID, CHARACTER_ID),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({
        proposedChanges: { name: { current: "Thorin", proposed: "Thorin II" } },
        reason: "Want a new name",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      `/api/campaigns/${CAMPAIGN_ID}/characters/${CHARACTER_ID}/request-modification`,
      expect.objectContaining({ method: "POST" })
    );
    const body = JSON.parse(mockApiFetch.mock.calls[0][1].body);
    expect(body.proposedChanges.name).toEqual({
      current: "Thorin",
      proposed: "Thorin II",
    });
    expect(body.commandId).toBeDefined();
  });

  it("should optimistically update status to pending_revalidation", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    queryClient.setQueryData(QUERY_KEY, makeCharacter());

    let resolveApi!: () => void;
    mockApiFetch.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveApi = resolve;
      })
    );

    const { result } = renderHook(
      () => useRequestCharacterModification(CAMPAIGN_ID, CHARACTER_ID),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      result.current.mutate({
        proposedChanges: { name: { current: "Thorin", proposed: "Thorin II" } },
      });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<CharacterDetail>(QUERY_KEY);
      expect(cached!.status).toBe("pending_revalidation");
    });

    await act(async () => {
      resolveApi();
    });
  });

  it("should rollback on error", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    queryClient.setQueryData(QUERY_KEY, makeCharacter());
    mockApiFetch.mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(
      () => useRequestCharacterModification(CAMPAIGN_ID, CHARACTER_ID),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      result.current.mutate({
        proposedChanges: { name: { current: "Thorin", proposed: "Thorin II" } },
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData<CharacterDetail>(QUERY_KEY);
    expect(cached!.status).toBe("approved");
  });

  it("should show success toast", async () => {
    const { result } = renderHook(
      () => useRequestCharacterModification(CAMPAIGN_ID, CHARACTER_ID),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({
        proposedChanges: { name: { current: "Thorin", proposed: "Thorin II" } },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.success).toHaveBeenCalledWith(
      "Modification request submitted for GM review"
    );
  });

  it("should show error toast on failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(
      () => useRequestCharacterModification(CAMPAIGN_ID, CHARACTER_ID),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({
        proposedChanges: { name: { current: "Thorin", proposed: "Thorin II" } },
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith(
      "Failed to submit modification request"
    );
  });
});
