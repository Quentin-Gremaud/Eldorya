import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import GmPrepMapsPage from "../page";

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    use: (promise: unknown) => {
      if (promise && typeof promise === "object") {
        return { id: "c1" };
      }
      return promise;
    },
  };
});

const mockMapLevels = [
  { id: "l1", campaignId: "c1", name: "World", parentId: null, depth: 0, createdAt: "2026-03-08", updatedAt: "2026-03-08" },
];

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: jest.fn().mockResolvedValue("mock-token") }),
}));

jest.mock("@/hooks/use-map-levels", () => ({
  useMapLevels: () => ({
    mapLevels: mockMapLevels,
    isLoading: false,
    isError: false,
  }),
}));

jest.mock("@/hooks/use-create-map-level", () => ({
  useCreateMapLevel: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

jest.mock("@/hooks/use-rename-map-level", () => ({
  useRenameMapLevel: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
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

describe("GmPrepMapsPage", () => {
  it("should render the map hierarchy page", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Map Hierarchy")).toBeInTheDocument();
    expect(screen.getByText("Create Map Level")).toBeInTheDocument();
  });

  it("should render map levels from the tree", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("World")).toBeInTheDocument();
  });

  it("should show canvas placeholder when no level selected", () => {
    render(
      <GmPrepMapsPage params={Promise.resolve({ id: "c1" })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Select a map level")).toBeInTheDocument();
  });
});
