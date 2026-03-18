import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { usePingPlayer } from "../use-ping-player";

const mockApiFetch = jest.fn();

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ userId: "gm-123", getToken: jest.fn().mockResolvedValue("mock-token") }),
}));

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

describe("usePingPlayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiFetch.mockResolvedValue(undefined);
  });

  it("should call API with correct params", async () => {
    const { result } = renderHook(() => usePingPlayer(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        campaignId: "c1",
        sessionId: "s1",
        playerId: "p1",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/c1/sessions/s1/ping",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );

    const body = JSON.parse(mockApiFetch.mock.calls[0][1].body);
    expect(body).toEqual({ playerId: "p1" });
  });

  it("should handle API error", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(() => usePingPlayer(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        campaignId: "c1",
        sessionId: "s1",
        playerId: "p1",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
