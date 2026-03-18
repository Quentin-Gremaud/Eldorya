import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { usePendingActions } from "../use-pending-actions";

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

describe("usePendingActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return pending actions", async () => {
    const actions = [
      {
        id: "a1",
        sessionId: "s1",
        campaignId: "c1",
        playerId: "p1",
        actionType: "move",
        description: "I move north",
        target: null,
        status: "pending",
        proposedAt: "2026-03-18T10:00:00.000Z",
      },
    ];

    mockApiFetch.mockResolvedValue({ data: actions });

    const { result } = renderHook(
      () => usePendingActions("c1", "s1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.actions).toEqual(actions);
  });

  it("should return empty array when no actions", async () => {
    mockApiFetch.mockResolvedValue({ data: [] });

    const { result } = renderHook(
      () => usePendingActions("c1", "s1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.actions).toEqual([]);
  });

  it("should call correct API endpoint", async () => {
    mockApiFetch.mockResolvedValue({ data: [] });

    renderHook(() => usePendingActions("c1", "s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/campaigns/c1/sessions/s1/actions/pending"
      );
    });
  });
});
