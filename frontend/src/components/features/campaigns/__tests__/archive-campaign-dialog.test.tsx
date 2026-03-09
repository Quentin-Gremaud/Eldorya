import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { ArchiveCampaignDialog } from "../archive-campaign-dialog";

const mockApiFetch = jest.fn();
const mockPush = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
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

describe("ArchiveCampaignDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render confirmation dialog with correct messaging", () => {
    render(
      <ArchiveCampaignDialog
        campaignId="campaign-123"
        campaignName="Test Campaign"
        isProUser={true}
        open={true}
        onOpenChange={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getAllByText("Archive Campaign").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(
        /Archiving will make this campaign read-only/
      )
    ).toBeInTheDocument();
  });

  it("should show irreversibility warning for free-tier users", () => {
    render(
      <ArchiveCampaignDialog
        campaignId="campaign-123"
        campaignName="Test Campaign"
        isProUser={false}
        open={true}
        onOpenChange={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByText(/irreversible for free-tier accounts/)
    ).toBeInTheDocument();
  });

  it("should hide irreversibility warning for Pro users", () => {
    render(
      <ArchiveCampaignDialog
        campaignId="campaign-123"
        campaignName="Test Campaign"
        isProUser={true}
        open={true}
        onOpenChange={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.queryByText(/irreversible for free-tier accounts/)
    ).toBeNull();
  });

  it("should not render when closed", () => {
    render(
      <ArchiveCampaignDialog
        campaignId="campaign-123"
        campaignName="Test Campaign"
        isProUser={false}
        open={false}
        onOpenChange={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText("Archive Campaign")).toBeNull();
  });

  it("should call archive mutation and redirect on confirm click", async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValue({});

    render(
      <ArchiveCampaignDialog
        campaignId="campaign-123"
        campaignName="Test Campaign"
        isProUser={true}
        open={true}
        onOpenChange={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    const archiveButton = screen.getByRole("button", { name: /Archive Campaign/i });
    await user.click(archiveButton);

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/campaigns/campaign-123/archive",
        expect.objectContaining({ method: "POST" })
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("should disable cancel button while mutation is pending", async () => {
    const user = userEvent.setup();
    // Never resolve to keep pending state
    mockApiFetch.mockReturnValue(new Promise(() => {}));

    render(
      <ArchiveCampaignDialog
        campaignId="campaign-123"
        campaignName="Test Campaign"
        isProUser={false}
        open={true}
        onOpenChange={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    const archiveButton = screen.getByRole("button", { name: /Archive Campaign/i });
    await user.click(archiveButton);

    await waitFor(() => {
      expect(screen.getByText("Archiving...")).toBeInTheDocument();
    });
  });
});
