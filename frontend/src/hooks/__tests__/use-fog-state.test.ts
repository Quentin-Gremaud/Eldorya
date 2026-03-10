import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useFogState } from "../use-fog-state";

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

describe("useFogState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty fogZones when API returns 404", async () => {
    mockApiFetch.mockRejectedValue({ statusCode: 404, message: "Not Found" });

    const { result } = renderHook(
      () => useFogState("campaign-1", "player-1", "level-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.fogZones).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it("should return fogZones when API returns data", async () => {
    const mockFogZones = [
      {
        id: "fz-1",
        mapLevelId: "level-1",
        playerId: "player-1",
        x: 100,
        y: 200,
        width: 300,
        height: 400,
        revealed: true,
        createdAt: "2026-03-10",
      },
    ];

    mockApiFetch.mockResolvedValue({ data: mockFogZones });

    const { result } = renderHook(
      () => useFogState("campaign-1", "player-1", "level-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.fogZones).toHaveLength(1);
    });

    expect(result.current.fogZones[0].id).toBe("fz-1");
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/campaign-1/fog-state?playerId=player-1&mapLevelId=level-1"
    );
  });

  it("should handle non-404 error states gracefully", async () => {
    mockApiFetch.mockRejectedValue({ statusCode: 500, message: "Server Error" });

    const { result } = renderHook(
      () => useFogState("campaign-1", "player-1", "level-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.fogZones).toEqual([]);
  });

  it("should not fetch when playerId is null", () => {
    const { result } = renderHook(
      () => useFogState("campaign-1", null, "level-1"),
      { wrapper: createWrapper() }
    );

    expect(result.current.fogZones).toEqual([]);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it("should not fetch when mapLevelId is null", () => {
    const { result } = renderHook(
      () => useFogState("campaign-1", "player-1", null),
      { wrapper: createWrapper() }
    );

    expect(result.current.fogZones).toEqual([]);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});
