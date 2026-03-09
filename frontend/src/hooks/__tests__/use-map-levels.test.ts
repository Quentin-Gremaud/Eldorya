import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useMapLevels } from "../use-map-levels";

const mockApiFetch = jest.fn();

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: jest.fn().mockResolvedValue("mock-token") }),
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
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe("useMapLevels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch map levels for a campaign", async () => {
    const levels = [
      { id: "l1", campaignId: "c1", name: "World", parentId: null, depth: 0, backgroundImageUrl: null, createdAt: "2026-03-08", updatedAt: "2026-03-08" },
    ];
    mockApiFetch.mockResolvedValue({ data: levels });

    const { result } = renderHook(() => useMapLevels("c1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.mapLevels).toEqual(levels);
    expect(result.current.isError).toBe(false);
  });

  it("should return empty array when no levels exist", async () => {
    mockApiFetch.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useMapLevels("c1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.mapLevels).toEqual([]);
  });

  it("should handle API error", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(() => useMapLevels("c1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("should use correct query key with campaignId", async () => {
    mockApiFetch.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useMapLevels("campaign-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/campaign-123/map-levels"
    );
  });
});
