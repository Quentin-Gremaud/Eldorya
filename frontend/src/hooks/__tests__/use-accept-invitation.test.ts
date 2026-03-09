import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useAcceptInvitation } from "../use-accept-invitation";

const mockPush = jest.fn();
const mockApiFetch = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: () => Promise.resolve("mock-token") }),
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

describe("useAcceptInvitation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call API with correct token on accept", async () => {
    mockApiFetch.mockResolvedValue({
      data: { campaignId: "campaign-456" },
    });

    const { result } = renderHook(() => useAcceptInvitation("my-token"), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.accept();
    });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/invitations/my-token/accept",
        { method: "POST" }
      );
    });
  });

  it("should redirect to campaign session on success", async () => {
    mockApiFetch.mockResolvedValue({
      data: { campaignId: "campaign-456" },
    });

    const { result } = renderHook(() => useAcceptInvitation("my-token"), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.accept();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/campaign/campaign-456/player/session"
      );
    });
  });

  it("should expose error on failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("Invitation expired"));

    const { result } = renderHook(() => useAcceptInvitation("expired-token"), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.accept();
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it("should show isPending while accepting", async () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAcceptInvitation("my-token"), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.accept();
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });
  });
});
