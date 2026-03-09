import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useCreateCharacter } from "../use-create-character";

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

const validPayload = {
  id: "char-123",
  name: "Gandalf",
  race: "Human",
  characterClass: "Mage",
  background: "A wandering wizard",
  stats: {
    strength: 8,
    dexterity: 14,
    constitution: 12,
    intelligence: 18,
    wisdom: 16,
    charisma: 10,
  },
  spells: ["Fireball", "Shield"],
};

describe("useCreateCharacter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiFetch.mockResolvedValue(undefined);
  });

  it("should call API with correct endpoint and payload", async () => {
    const { result } = renderHook(
      () => useCreateCharacter("campaign-456"),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate(validPayload);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/campaign-456/characters",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validPayload),
      }
    );
  });

  it("should handle API error", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(
      () => useCreateCharacter("campaign-456"),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate(validPayload);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("should be idle initially", () => {
    const { result } = renderHook(
      () => useCreateCharacter("campaign-456"),
      { wrapper: createWrapper() }
    );

    expect(result.current.isIdle).toBe(true);
    expect(result.current.isPending).toBe(false);
  });
});
