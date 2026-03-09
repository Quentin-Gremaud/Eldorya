import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useUploadMapBackground } from "../use-upload-map-background";

const mockApiFetch = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
}));

// Mock global fetch for S3 upload
const mockFetch = jest.fn();
global.fetch = mockFetch;

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

function createMockFile(
  name = "test.jpg",
  type = "image/jpeg",
  size = 1024
): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe("useUploadMapBackground", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock presigned URL request
    mockApiFetch.mockImplementation((url: string) => {
      if (url.includes("upload-url")) {
        return Promise.resolve({
          data: {
            uploadUrl: "https://s3.amazonaws.com/presigned",
            publicUrl: "https://cdn.example.com/bg.jpg",
          },
        });
      }
      // Mock set background
      return Promise.resolve(undefined);
    });

    // Mock S3 upload
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("should complete full upload flow", async () => {
    const { result } = renderHook(
      () => useUploadMapBackground("campaign-1", "level-1"),
      { wrapper: createWrapper() }
    );

    expect(result.current.status).toBe("idle");

    await act(async () => {
      await result.current.upload(createMockFile());
    });

    await waitFor(() => {
      expect(result.current.status).toBe("done");
    });

    // Step 1: Request presigned URL
    expect(mockApiFetch).toHaveBeenCalledWith(
      expect.stringContaining("upload-url"),
      expect.any(Object)
    );

    // Step 2: Upload to S3
    expect(mockFetch).toHaveBeenCalledWith(
      "https://s3.amazonaws.com/presigned",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
      })
    );

    // Step 3: Confirm background
    expect(mockApiFetch).toHaveBeenCalledWith(
      expect.stringContaining("/background"),
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("should handle presigned URL request failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(
      () => useUploadMapBackground("campaign-1", "level-1"),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      try {
        await result.current.upload(createMockFile());
      } catch {
        // Expected
      }
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
      expect(result.current.error).toBe("API error");
    });
  });

  it("should handle S3 upload failure", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(
      () => useUploadMapBackground("campaign-1", "level-1"),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      try {
        await result.current.upload(createMockFile());
      } catch {
        // Expected
      }
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
      expect(result.current.error).toBe("Failed to upload file to storage");
    });
  });

  it("should reset state", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(
      () => useUploadMapBackground("campaign-1", "level-1"),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      try {
        await result.current.upload(createMockFile());
      } catch {
        // Expected
      }
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
  });

  it("should report isUploading during upload and confirming phases", async () => {
    let resolvePresigned: (value: any) => void;
    mockApiFetch.mockImplementation((url: string) => {
      if (url.includes("upload-url")) {
        return new Promise((resolve) => {
          resolvePresigned = resolve;
        });
      }
      return Promise.resolve(undefined);
    });

    const { result } = renderHook(
      () => useUploadMapBackground("campaign-1", "level-1"),
      { wrapper: createWrapper() }
    );

    expect(result.current.isUploading).toBe(false);

    // Start upload without awaiting
    let uploadPromise: Promise<void>;
    act(() => {
      uploadPromise = result.current.upload(createMockFile());
    });

    await waitFor(() => {
      expect(result.current.isUploading).toBe(true);
    });

    // Resolve to let the flow complete
    await act(async () => {
      resolvePresigned!({
        data: {
          uploadUrl: "https://s3.amazonaws.com/presigned",
          publicUrl: "https://cdn.example.com/bg.jpg",
        },
      });
      await uploadPromise;
    });

    await waitFor(() => {
      expect(result.current.isUploading).toBe(false);
    });
  });
});
