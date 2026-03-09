import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useUnequipItem } from "../use-unequip-item";
import { toast } from "sonner";
import type { Inventory } from "@/types/api";

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

const CHARACTER_ID = "char-1";
const QUERY_KEY = ["characters", CHARACTER_ID, "inventory"];

const makeInventory = (): Inventory => ({
  characterId: CHARACTER_ID,
  campaignId: "campaign-1",
  equipmentSlots: {
    head: null,
    torso: null,
    hands: null,
    legs: null,
    feet: null,
    ring1: null,
    ring2: null,
    weapon_shield: {
      id: "item-1",
      name: "Iron Sword",
      description: "A sword",
      weight: 3,
      slotType: "weapon_shield",
      statModifiers: { strength: 2 },
      position: null,
      equippedSlot: "weapon_shield",
    },
  },
  backpackItems: [],
  items: [
    {
      id: "item-1",
      name: "Iron Sword",
      description: "A sword",
      weight: 3,
      slotType: "weapon_shield",
      statModifiers: { strength: 2 },
      position: null,
      equippedSlot: "weapon_shield",
    },
  ],
  currentWeight: 3,
  maxCapacity: 20,
});

function createWrapper(queryClient?: QueryClient) {
  const client =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client },
      children
    );
  };
}

describe("useUnequipItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiFetch.mockResolvedValue(undefined);
  });

  it("should call correct endpoint with POST", async () => {
    const { result } = renderHook(() => useUnequipItem(CHARACTER_ID), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ itemId: "item-1" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/characters/char-1/inventory/unequip",
      expect.objectContaining({
        method: "POST",
      })
    );

    const body = JSON.parse(mockApiFetch.mock.calls[0][1].body);
    expect(body.itemId).toBe("item-1");
  });

  it("should optimistically move item from equipment to backpack", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    queryClient.setQueryData(QUERY_KEY, makeInventory());

    let resolveApi!: () => void;
    mockApiFetch.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveApi = resolve;
      })
    );

    const { result } = renderHook(() => useUnequipItem(CHARACTER_ID), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ itemId: "item-1" });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Inventory>(QUERY_KEY);
      expect(cached!.equipmentSlots.weapon_shield).toBeNull();
      expect(cached!.backpackItems).toHaveLength(1);
      expect(cached!.backpackItems[0].id).toBe("item-1");
    });

    await act(async () => {
      resolveApi();
    });
  });

  it("should rollback on error", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const inventory = makeInventory();
    queryClient.setQueryData(QUERY_KEY, inventory);

    mockApiFetch.mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(() => useUnequipItem(CHARACTER_ID), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ itemId: "item-1" });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData<Inventory>(QUERY_KEY);
    expect(cached!.backpackItems).toHaveLength(0);
    expect(cached!.equipmentSlots.weapon_shield).toBeTruthy();
  });

  it("should show error toast on failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(() => useUnequipItem(CHARACTER_ID), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ itemId: "item-1" });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to unequip item");
  });
});
