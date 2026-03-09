import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useActiveCampaignCount } from "../use-active-campaign-count";

const mockApiFetch = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
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

describe("useActiveCampaignCount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return loading state initially", () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useActiveCampaignCount(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.activeCount).toBeUndefined();
  });

  it("should return active count on success", async () => {
    mockApiFetch.mockResolvedValue({ count: 2 });

    const { result } = renderHook(() => useActiveCampaignCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.activeCount).toBe(2);
    expect(result.current.isError).toBe(false);
  });

  it("should return undefined on error", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useActiveCampaignCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.activeCount).toBeUndefined();
  });
});
