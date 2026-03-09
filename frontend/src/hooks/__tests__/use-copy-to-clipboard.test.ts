import { renderHook, act } from "@testing-library/react";
import { useCopyToClipboard } from "../use-copy-to-clipboard";

describe("useCopyToClipboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should copy text to clipboard and set copied to true", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("test text");
    });

    expect(writeText).toHaveBeenCalledWith("test text");
    expect(result.current.copied).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("should set error when clipboard write fails", async () => {
    const writeText = jest
      .fn()
      .mockRejectedValue(new Error("Permission denied"));
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("test text");
    });

    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe("Permission denied");
  });

  it("should reset copied state after 2 seconds", async () => {
    jest.useFakeTimers();

    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("test text");
    });

    expect(result.current.copied).toBe(true);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);

    jest.useRealTimers();
  });
});
