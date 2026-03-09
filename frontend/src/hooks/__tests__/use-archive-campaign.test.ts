import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useArchiveCampaign } from "../use-archive-campaign";

const mockApiFetch = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
}));

function createWrapper(queryClient?: QueryClient) {
  const qc =
    queryClient ??
    new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe("useArchiveCampaign", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call archive API endpoint", async () => {
    mockApiFetch.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useArchiveCampaign("campaign-123"),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/campaign-123/archive",
      { method: "POST" }
    );
  });

  it("should optimistically set status to archived", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    queryClient.setQueryData(["campaigns", "campaign-123"], {
      id: "campaign-123",
      name: "Test",
      status: "active",
    });

    mockApiFetch.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useArchiveCampaign("campaign-123"),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      result.current.mutate();
    });

    const cached = queryClient.getQueryData<{ status: string }>([
      "campaigns",
      "campaign-123",
    ]);
    expect(cached?.status).toBe("archived");
  });

  it("should rollback on error", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const previousData = {
      id: "campaign-123",
      name: "Test",
      status: "active",
    };

    queryClient.setQueryData(["campaigns", "campaign-123"], previousData);

    mockApiFetch.mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(
      () => useArchiveCampaign("campaign-123"),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData(["campaigns", "campaign-123"]);
    expect(cached).toEqual(previousData);
  });
});
