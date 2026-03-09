import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useCreateMapLevel } from "../use-create-map-level";

const mockApiFetch = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
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

describe("useCreateMapLevel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiFetch.mockResolvedValue(undefined);
  });

  it("should call apiFetch with correct params", async () => {
    const { result } = renderHook(() => useCreateMapLevel("campaign-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        mapLevelId: "level-uuid",
        name: "World",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/campaign-1/map-levels",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );

    const body = JSON.parse(mockApiFetch.mock.calls[0][1].body);
    expect(body).toEqual(
      expect.objectContaining({
        mapLevelId: "level-uuid",
        name: "World",
        commandId: expect.any(String),
      })
    );
  });

  it("should include parentId when provided", async () => {
    const { result } = renderHook(() => useCreateMapLevel("campaign-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        mapLevelId: "level-uuid",
        name: "City",
        parentId: "parent-level-1",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const body = JSON.parse(mockApiFetch.mock.calls[0][1].body);
    expect(body).toEqual(
      expect.objectContaining({
        name: "City",
        parentId: "parent-level-1",
      })
    );
  });

  it("should handle API error", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(() => useCreateMapLevel("campaign-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        mapLevelId: "level-uuid",
        name: "World",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
