import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { ReactivateCampaignButton } from "../reactivate-campaign-button";

const mockApiFetch = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("ReactivateCampaignButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render button with correct label", () => {
    render(
      <ReactivateCampaignButton campaignId="campaign-123" />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Reactivate Campaign")).toBeInTheDocument();
  });

  it("should be enabled by default", () => {
    render(
      <ReactivateCampaignButton campaignId="campaign-123" />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByRole("button", { name: /Reactivate Campaign/ });
    expect(button.hasAttribute("disabled")).toBe(false);
  });

  it("should call reactivate mutation on click", async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValue({});

    render(
      <ReactivateCampaignButton campaignId="campaign-123" />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByRole("button", { name: /Reactivate Campaign/ });
    await user.click(button);

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/campaigns/campaign-123/reactivate",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("should show loading state while mutation is pending", async () => {
    const user = userEvent.setup();
    mockApiFetch.mockReturnValue(new Promise(() => {}));

    render(
      <ReactivateCampaignButton campaignId="campaign-123" />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByRole("button", { name: /Reactivate Campaign/ });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Reactivating...")).toBeInTheDocument();
    });
  });
});
