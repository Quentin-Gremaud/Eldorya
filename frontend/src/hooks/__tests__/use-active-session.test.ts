import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useActiveSession } from "../use-active-session";

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

describe("useActiveSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return session when active session exists", async () => {
    const session = {
      id: "session-1",
      campaignId: "campaign-1",
      gmUserId: "gm-1",
      mode: "preparation" as const,
      status: "active" as const,
      startedAt: "2026-03-14T10:00:00.000Z",
      endedAt: null,
    };

    mockApiFetch.mockResolvedValue({ data: session });

    const { result } = renderHook(() => useActiveSession("campaign-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.session).toEqual(session);
    expect(result.current.isError).toBe(false);
  });

  it("should return null when no active session exists", async () => {
    mockApiFetch.mockResolvedValue({ data: null });

    const { result } = renderHook(() => useActiveSession("campaign-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.session).toBeNull();
  });

  it("should call correct API endpoint", async () => {
    mockApiFetch.mockResolvedValue({ data: null });

    renderHook(() => useActiveSession("campaign-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/campaigns/campaign-1/sessions/active"
      );
    });
  });
});
