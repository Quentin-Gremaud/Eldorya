import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useSetMapBackground } from "../use-set-map-background";

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

describe("useSetMapBackground", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiFetch.mockResolvedValue(undefined);
  });

  it("should call apiFetch with correct params", async () => {
    const { result } = renderHook(
      () => useSetMapBackground("campaign-1", "level-1"),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({
        backgroundImageUrl: "https://cdn.example.com/bg.jpg",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/campaign-1/map-levels/level-1/background",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })
    );

    const body = JSON.parse(mockApiFetch.mock.calls[0][1].body);
    expect(body).toEqual(
      expect.objectContaining({
        backgroundImageUrl: "https://cdn.example.com/bg.jpg",
        commandId: expect.any(String),
      })
    );
  });

  it("should handle API error", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(
      () => useSetMapBackground("campaign-1", "level-1"),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({
        backgroundImageUrl: "https://cdn.example.com/bg.jpg",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
