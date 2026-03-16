import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useChangeSessionMode } from "../use-change-session-mode";

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
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe("useChangeSessionMode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiFetch.mockResolvedValue(undefined);
  });

  it("should call API with correct params for live mode", async () => {
    const { result } = renderHook(() => useChangeSessionMode(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        campaignId: "campaign-1",
        sessionId: "session-1",
        mode: "live",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/campaign-1/sessions/session-1/mode",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })
    );

    const body = JSON.parse(mockApiFetch.mock.calls[0][1].body);
    expect(body).toEqual({ mode: "live" });
  });

  it("should call API with correct params for preparation mode", async () => {
    const { result } = renderHook(() => useChangeSessionMode(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        campaignId: "campaign-1",
        sessionId: "session-1",
        mode: "preparation",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const body = JSON.parse(mockApiFetch.mock.calls[0][1].body);
    expect(body).toEqual({ mode: "preparation" });
  });

  it("should handle API error", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(() => useChangeSessionMode(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        campaignId: "campaign-1",
        sessionId: "session-1",
        mode: "live",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
