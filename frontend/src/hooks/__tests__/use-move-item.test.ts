import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useMoveItem } from "../use-move-item";
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
    weapon_shield: null,
  },
  backpackItems: [
    {
      id: "item-1",
      name: "Iron Sword",
      description: "A sword",
      weight: 3,
      slotType: "weapon_shield",
      statModifiers: { strength: 2 },
      position: 0,
    },
    {
      id: "item-2",
      name: "Health Potion",
      description: "A potion",
      weight: 1,
      slotType: "weapon_shield",
      statModifiers: {},
      position: 1,
    },
  ],
  items: [
    {
      id: "item-1",
      name: "Iron Sword",
      description: "A sword",
      weight: 3,
      slotType: "weapon_shield",
      statModifiers: { strength: 2 },
      position: 0,
      equippedSlot: null,
    },
    {
      id: "item-2",
      name: "Health Potion",
      description: "A potion",
      weight: 1,
      slotType: "weapon_shield",
      statModifiers: {},
      position: 1,
      equippedSlot: null,
    },
  ],
  currentWeight: 4,
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

describe("useMoveItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiFetch.mockResolvedValue(undefined);
  });

  it("should call correct endpoint with POST", async () => {
    const { result } = renderHook(() => useMoveItem(CHARACTER_ID), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ itemId: "item-1", toPosition: 1 });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/characters/char-1/inventory/move",
      expect.objectContaining({
        method: "POST",
      })
    );

    const body = JSON.parse(mockApiFetch.mock.calls[0][1].body);
    expect(body.itemId).toBe("item-1");
    expect(body.toPosition).toBe(1);
  });

  it("should optimistically swap item positions", async () => {
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

    const { result } = renderHook(() => useMoveItem(CHARACTER_ID), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ itemId: "item-1", toPosition: 1 });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Inventory>(QUERY_KEY);
      const movedItem = cached!.backpackItems.find((i) => i.id === "item-1");
      const swappedItem = cached!.backpackItems.find((i) => i.id === "item-2");
      expect(movedItem!.position).toBe(1);
      expect(swappedItem!.position).toBe(0);
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

    queryClient.setQueryData(QUERY_KEY, makeInventory());
    mockApiFetch.mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(() => useMoveItem(CHARACTER_ID), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ itemId: "item-1", toPosition: 1 });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData<Inventory>(QUERY_KEY);
    const item1 = cached!.backpackItems.find((i) => i.id === "item-1");
    const item2 = cached!.backpackItems.find((i) => i.id === "item-2");
    expect(item1!.position).toBe(0);
    expect(item2!.position).toBe(1);
  });

  it("should show error toast on failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(() => useMoveItem(CHARACTER_ID), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ itemId: "item-1", toPosition: 1 });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to move item");
  });
});
