import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useRejectAction } from "../use-reject-action";

const mockApiFetch = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useRejectAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiFetch.mockResolvedValue(undefined);
  });

  it("should call API with correct params", async () => {
    const { result } = renderHook(() => useRejectAction(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        campaignId: "c1",
        sessionId: "s1",
        actionId: "a1",
        feedback: "Too far away",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/c1/sessions/s1/actions/a1/reject",
      expect.objectContaining({
        method: "POST",
      })
    );

    const body = JSON.parse(mockApiFetch.mock.calls[0][1].body);
    expect(body).toEqual({ feedback: "Too far away" });
  });

  it("should handle API error", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(() => useRejectAction(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        campaignId: "c1",
        sessionId: "s1",
        actionId: "a1",
        feedback: "reason",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("should rollback cache on API error", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const pendingActions = [
      { id: "a1", sessionId: "s1", campaignId: "c1", playerId: "p1", actionType: "move", description: "I move", target: null, status: "pending", proposedAt: "2026-03-18T10:00:00.000Z" },
      { id: "a2", sessionId: "s1", campaignId: "c1", playerId: "p2", actionType: "attack", description: "I attack", target: null, status: "pending", proposedAt: "2026-03-18T10:01:00.000Z" },
    ];
    queryClient.setQueryData(["actions", "c1", "s1", "pending"], pendingActions);

    mockApiFetch.mockRejectedValue(new Error("API error"));

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useRejectAction(), { wrapper });

    await act(async () => {
      result.current.mutate({
        campaignId: "c1",
        sessionId: "s1",
        actionId: "a1",
        feedback: "Too far",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const restored = queryClient.getQueryData(["actions", "c1", "s1", "pending"]);
    expect(restored).toEqual(pendingActions);
  });
});
