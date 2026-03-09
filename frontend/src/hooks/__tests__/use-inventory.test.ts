import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useInventory } from "../use-inventory";

const mockApiFetch = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
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

const mockInventory = {
  characterId: "char-1",
  equipmentSlots: {
    head: null,
    torso: null,
    hands: null,
    legs: null,
    feet: null,
    ring1: null,
    ring2: null,
    weapon_shield: null,
  },
  backpackItems: [],
  items: [],
  currentWeight: 0,
  maxCapacity: 20,
};

describe("useInventory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return loading state initially", () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useInventory("char-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.inventory).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it("should return inventory on success", async () => {
    mockApiFetch.mockResolvedValue({ data: mockInventory });

    const { result } = renderHook(() => useInventory("char-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.inventory).toEqual(mockInventory);
    expect(result.current.isError).toBe(false);
  });

  it("should call API with correct endpoint", async () => {
    mockApiFetch.mockResolvedValue({ data: mockInventory });

    renderHook(() => useInventory("char-xyz"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/characters/char-xyz/inventory"
      );
    });
  });

  it("should handle error state", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useInventory("char-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
  });
});
