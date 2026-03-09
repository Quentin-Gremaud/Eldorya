import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { usePendingModifications } from "../use-pending-modifications";

const mockApiFetch = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe("usePendingModifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch pending modifications for campaign", async () => {
    const mockData = [
      { id: "char-1", name: "Thorin", status: "pending_revalidation" },
    ];
    mockApiFetch.mockResolvedValue({ data: mockData });

    const { result } = renderHook(
      () => usePendingModifications("camp-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.modifications).toEqual(mockData);
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/camp-1/characters/pending-modifications"
    );
  });

  it("should return empty array when no data", async () => {
    mockApiFetch.mockResolvedValue({ data: [] });

    const { result } = renderHook(
      () => usePendingModifications("camp-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.modifications).toEqual([]);
  });

  it("should not fetch when campaignId is empty", async () => {
    renderHook(
      () => usePendingModifications(""),
      { wrapper: createWrapper() }
    );

    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});
