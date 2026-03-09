import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useRequestMapBackgroundUpload } from "../use-request-map-background-upload";

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

describe("useRequestMapBackgroundUpload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiFetch.mockResolvedValue({
      data: {
        uploadUrl: "https://s3.amazonaws.com/presigned",
        publicUrl: "https://cdn.example.com/bg.jpg",
      },
    });
  });

  it("should call apiFetch with correct params", async () => {
    const { result } = renderHook(
      () => useRequestMapBackgroundUpload("campaign-1", "level-1"),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({
        contentType: "image/jpeg",
        fileSizeBytes: 1024000,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/campaign-1/map-levels/level-1/background/upload-url",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );

    const body = JSON.parse(mockApiFetch.mock.calls[0][1].body);
    expect(body).toEqual(
      expect.objectContaining({
        contentType: "image/jpeg",
        fileSizeBytes: 1024000,
        commandId: expect.any(String),
      })
    );
  });

  it("should return upload and public URLs", async () => {
    const { result } = renderHook(
      () => useRequestMapBackgroundUpload("campaign-1", "level-1"),
      { wrapper: createWrapper() }
    );

    let response: any;
    await act(async () => {
      response = await result.current.mutateAsync({
        contentType: "image/png",
        fileSizeBytes: 2048,
      });
    });

    expect(response).toEqual({
      uploadUrl: "https://s3.amazonaws.com/presigned",
      publicUrl: "https://cdn.example.com/bg.jpg",
    });
  });

  it("should handle API error", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(
      () => useRequestMapBackgroundUpload("campaign-1", "level-1"),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({
        contentType: "image/jpeg",
        fileSizeBytes: 1024,
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
