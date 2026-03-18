import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useReorderActionQueue } from "../use-reorder-action-queue";
import type { PendingAction } from "@/types/api";

const mockReorderActionQueue = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => jest.fn(),
}));

jest.mock("@/lib/api/actions-api", () => ({
  createActionsApi: () => ({
    reorderActionQueue: mockReorderActionQueue,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return {
    queryClient,
    Wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

describe("useReorderActionQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should optimistically reorder actions in cache", async () => {
    const { queryClient, Wrapper } = createWrapper();
    const a1: PendingAction = {
      id: "a1", sessionId: "s1", campaignId: "c1", playerId: "p1",
      actionType: "move", description: "Move", target: null,
      status: "pending", proposedAt: "2026-03-18T10:00:00.000Z",
    };
    const a2: PendingAction = {
      id: "a2", sessionId: "s1", campaignId: "c1", playerId: "p1",
      actionType: "attack", description: "Attack", target: null,
      status: "pending", proposedAt: "2026-03-18T10:01:00.000Z",
    };
    queryClient.setQueryData(["actions", "c1", "s1", "pending"], [a1, a2]);

    const { result } = renderHook(() => useReorderActionQueue(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({
        campaignId: "c1",
        sessionId: "s1",
        orderedActionIds: ["a2", "a1"],
      });
    });

    await waitFor(() => {
      const actions = queryClient.getQueryData<PendingAction[]>([
        "actions", "c1", "s1", "pending",
      ]);
      expect(actions?.[0].id).toBe("a2");
      expect(actions?.[1].id).toBe("a1");
    });
  });

  it("should rollback on error", async () => {
    mockReorderActionQueue.mockRejectedValueOnce(new Error("Network error"));

    const { queryClient, Wrapper } = createWrapper();
    const a1: PendingAction = {
      id: "a1", sessionId: "s1", campaignId: "c1", playerId: "p1",
      actionType: "move", description: "Move", target: null,
      status: "pending", proposedAt: "2026-03-18T10:00:00.000Z",
    };
    const a2: PendingAction = {
      id: "a2", sessionId: "s1", campaignId: "c1", playerId: "p1",
      actionType: "attack", description: "Attack", target: null,
      status: "pending", proposedAt: "2026-03-18T10:01:00.000Z",
    };
    queryClient.setQueryData(["actions", "c1", "s1", "pending"], [a1, a2]);

    const { result } = renderHook(() => useReorderActionQueue(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({
        campaignId: "c1",
        sessionId: "s1",
        orderedActionIds: ["a2", "a1"],
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const actions = queryClient.getQueryData<PendingAction[]>([
      "actions", "c1", "s1", "pending",
    ]);
    expect(actions?.[0].id).toBe("a1");
    expect(actions?.[1].id).toBe("a2");
  });

  it("should call API with correct payload", async () => {
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useReorderActionQueue(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({
        campaignId: "c1",
        sessionId: "s1",
        orderedActionIds: ["a2", "a1"],
      });
    });

    await waitFor(() => {
      expect(mockReorderActionQueue).toHaveBeenCalledWith("c1", "s1", {
        orderedActionIds: ["a2", "a1"],
      });
    });
  });
});
