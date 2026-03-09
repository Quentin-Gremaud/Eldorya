import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useAddItemToInventory } from "../use-add-item-to-inventory";
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
  backpackItems: [],
  items: [],
  currentWeight: 0,
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

describe("useAddItemToInventory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiFetch.mockResolvedValue(undefined);
  });

  it("should call correct endpoint with POST", async () => {
    const { result } = renderHook(
      () => useAddItemToInventory(CAMPAIGN_ID, CHARACTER_ID),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({
        itemId: "item-1",
        name: "Potion",
        weight: 1,
        slotType: "hands",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      `/api/campaigns/${CAMPAIGN_ID}/characters/${CHARACTER_ID}/inventory/add-item`,
      expect.objectContaining({ method: "POST" })
    );
    const body = JSON.parse(mockApiFetch.mock.calls[0][1].body);
    expect(body.itemId).toBe("item-1");
    expect(body.name).toBe("Potion");
    expect(body.commandId).toBeDefined();
  });

  it("should optimistically add item and update weight", async () => {
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
      () => useAddItemToInventory(CAMPAIGN_ID, CHARACTER_ID),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      result.current.mutate({
        itemId: "item-1",
        name: "Potion",
        weight: 2,
        slotType: "hands",
      });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Inventory>(QUERY_KEY);
      expect(cached!.backpackItems).toHaveLength(1);
      expect(cached!.backpackItems[0].name).toBe("Potion");
      expect(cached!.currentWeight).toBe(2);
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
      () => useAddItemToInventory(CAMPAIGN_ID, CHARACTER_ID),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      result.current.mutate({
        itemId: "item-1",
        name: "Potion",
        weight: 2,
        slotType: "hands",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData<Inventory>(QUERY_KEY);
    expect(cached!.backpackItems).toHaveLength(0);
    expect(cached!.currentWeight).toBe(0);
  });

  it("should show success toast", async () => {
    const { result } = renderHook(
      () => useAddItemToInventory(CAMPAIGN_ID, CHARACTER_ID),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({
        itemId: "item-1",
        name: "Potion",
        weight: 1,
        slotType: "hands",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.success).toHaveBeenCalledWith("Item added to inventory");
  });

  it("should show error toast on failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(
      () => useAddItemToInventory(CAMPAIGN_ID, CHARACTER_ID),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({
        itemId: "item-1",
        name: "Potion",
        weight: 1,
        slotType: "hands",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to add item");
  });
});
