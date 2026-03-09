import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useCreateCampaign } from "../use-create-campaign";

const mockGetToken = jest.fn().mockResolvedValue("mock-token");
const mockPush = jest.fn();
const mockCreateCampaign = jest.fn();

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/api/campaigns-api", () => ({
  createCampaign: (...args: unknown[]) => mockCreateCampaign(...args),
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

describe("useCreateCampaign", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateCampaign.mockResolvedValue(undefined);
  });

  it("should call createCampaign API with correct params", async () => {
    const { result } = renderHook(() => useCreateCampaign(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        id: "campaign-123",
        name: "My Campaign",
        description: "A great one",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCreateCampaign).toHaveBeenCalledWith(
      { id: "campaign-123", name: "My Campaign", description: "A great one" },
      "mock-token"
    );
  });

  it("should handle API error", async () => {
    mockCreateCampaign.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(() => useCreateCampaign(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        id: "campaign-123",
        name: "My Campaign",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
