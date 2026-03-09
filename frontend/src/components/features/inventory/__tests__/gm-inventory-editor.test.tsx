import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GmInventoryEditor } from "../gm-inventory-editor";

const mockUseInventory = jest.fn();
const mockAddItemMutate = jest.fn();
const mockRemoveItemMutate = jest.fn();

jest.mock("@/hooks/use-inventory", () => ({
  useInventory: (...args: unknown[]) => mockUseInventory(...args),
}));

jest.mock("@/hooks/use-add-item-to-inventory", () => ({
  useAddItemToInventory: () => ({
    mutate: mockAddItemMutate,
    isPending: false,
  }),
}));

jest.mock("@/hooks/use-remove-item-from-inventory", () => ({
  useRemoveItemFromInventory: () => ({
    mutate: mockRemoveItemMutate,
    isPending: false,
  }),
}));

jest.mock("@/hooks/use-equip-item", () => ({
  useEquipItem: () => ({ mutate: jest.fn() }),
}));

jest.mock("@/hooks/use-unequip-item", () => ({
  useUnequipItem: () => ({ mutate: jest.fn() }),
}));

jest.mock("@/hooks/use-move-item", () => ({
  useMoveItem: () => ({ mutate: jest.fn() }),
}));

jest.mock("@/hooks/use-drop-item", () => ({
  useDropItem: () => ({ mutate: jest.fn() }),
}));

jest.mock("@/hooks/use-modify-max-capacity", () => ({
  useModifyMaxCapacity: () => ({ mutate: jest.fn(), isPending: false }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("GmInventoryEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show loading skeleton while loading", () => {
    mockUseInventory.mockReturnValue({
      inventory: null,
      isLoading: true,
      isError: false,
    });

    renderWithProviders(
      <GmInventoryEditor campaignId="camp-1" characterId="char-1" />
    );

    // Skeletons are rendered (no specific text)
    expect(screen.queryByText("No inventory yet.")).not.toBeInTheDocument();
  });

  it("should show error state with retry button", () => {
    mockUseInventory.mockReturnValue({
      inventory: null,
      isLoading: false,
      isError: true,
    });

    renderWithProviders(
      <GmInventoryEditor campaignId="camp-1" characterId="char-1" />
    );

    expect(screen.getByText("Failed to load inventory.")).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("should show empty state when no inventory", () => {
    mockUseInventory.mockReturnValue({
      inventory: null,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(
      <GmInventoryEditor campaignId="camp-1" characterId="char-1" />
    );

    expect(screen.getByText("No inventory yet.")).toBeInTheDocument();
  });

  it("should render Add Item button when inventory exists", () => {
    mockUseInventory.mockReturnValue({
      inventory: {
        characterId: "char-1",
        campaignId: "camp-1",
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
      },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(
      <GmInventoryEditor campaignId="camp-1" characterId="char-1" />
    );

    expect(screen.getByText("Add Item")).toBeInTheDocument();
  });
});
