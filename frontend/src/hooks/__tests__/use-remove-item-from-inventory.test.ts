import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useRemoveItemFromInventory } from "../use-remove-item-from-inventory";
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

const CAMPAIGN_ID = "campaign-1";
const CHARACTER_ID = "char-1";
const QUERY_KEY = ["characters", CHARACTER_ID, "inventory"];

const makeInventory = (): Inventory => ({
  characterId: CHARACTER_ID,
  campaignId: CAMPAIGN_ID,
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
      statModifiers: {},
      position: 0,
    },
  ],
  items: [
    {
      id: "item-1",
      name: "Iron Sword",
      description: "A sword",
      weight: 3,
      slotType: "weapon_shield",
      statModifiers: {},
      position: 0,
      equippedSlot: null,
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
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe("useRemoveItemFromInventory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiFetch.mockResolvedValue(undefined);
  });

  it("should call correct endpoint with POST", async () => {
    const { result } = renderHook(
      () => useRemoveItemFromInventory(CAMPAIGN_ID, CHARACTER_ID),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({ itemId: "item-1" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      `/api/campaigns/${CAMPAIGN_ID}/characters/${CHARACTER_ID}/inventory/remove-item`,
      expect.objectContaining({ method: "POST" })
    );
  });

  it("should optimistically remove item and update weight", async () => {
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

    const { result } = renderHook(
      () => useRemoveItemFromInventory(CAMPAIGN_ID, CHARACTER_ID),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      result.current.mutate({ itemId: "item-1" });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Inventory>(QUERY_KEY);
      expect(cached!.backpackItems).toHaveLength(0);
      expect(cached!.items).toHaveLength(0);
      expect(cached!.currentWeight).toBe(0);
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

    const { result } = renderHook(
      () => useRemoveItemFromInventory(CAMPAIGN_ID, CHARACTER_ID),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      result.current.mutate({ itemId: "item-1" });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData<Inventory>(QUERY_KEY);
    expect(cached!.backpackItems).toHaveLength(1);
    expect(cached!.currentWeight).toBe(3);
  });

  it("should show success toast", async () => {
    const { result } = renderHook(
      () => useRemoveItemFromInventory(CAMPAIGN_ID, CHARACTER_ID),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({ itemId: "item-1" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.success).toHaveBeenCalledWith("Item removed from inventory");
  });

  it("should show error toast on failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(
      () => useRemoveItemFromInventory(CAMPAIGN_ID, CHARACTER_ID),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({ itemId: "item-1" });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to remove item");
  });
});
