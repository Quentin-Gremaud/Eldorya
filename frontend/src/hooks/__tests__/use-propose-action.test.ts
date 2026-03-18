import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useProposeAction } from "../use-propose-action";

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

describe("useProposeAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiFetch.mockResolvedValue(undefined);
  });

  it("should call API with correct params", async () => {
    const { result } = renderHook(() => useProposeAction(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        campaignId: "c1",
        sessionId: "s1",
        actionId: "a1",
        actionType: "move",
        description: "I move north",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/c1/sessions/s1/actions",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );

    const body = JSON.parse(mockApiFetch.mock.calls[0][1].body);
    expect(body).toEqual({
      actionId: "a1",
      actionType: "move",
      description: "I move north",
    });
  });

  it("should pass target when provided", async () => {
    const { result } = renderHook(() => useProposeAction(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        campaignId: "c1",
        sessionId: "s1",
        actionId: "a1",
        actionType: "attack",
        description: "I attack",
        target: "token-1",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const body = JSON.parse(mockApiFetch.mock.calls[0][1].body);
    expect(body.target).toBe("token-1");
  });

  it("should handle API error", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(() => useProposeAction(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        campaignId: "c1",
        sessionId: "s1",
        actionId: "a1",
        actionType: "move",
        description: "I move",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
