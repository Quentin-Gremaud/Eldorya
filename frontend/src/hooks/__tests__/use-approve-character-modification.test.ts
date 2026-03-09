import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useApproveCharacterModification } from "../use-approve-character-modification";
import { toast } from "sonner";

const mockApiFetch = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe("useApproveCharacterModification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiFetch.mockResolvedValue(undefined);
  });

  it("should call correct endpoint with POST", async () => {
    const { result } = renderHook(
      () => useApproveCharacterModification("camp-1"),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate("char-1");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/camp-1/characters/char-1/approve-modification",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("should show success toast", async () => {
    const { result } = renderHook(
      () => useApproveCharacterModification("camp-1"),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate("char-1");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.success).toHaveBeenCalledWith("Modification approved!");
  });

  it("should show error toast on failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(
      () => useApproveCharacterModification("camp-1"),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate("char-1");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to approve modification");
  });
});
