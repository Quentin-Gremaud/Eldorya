import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { InvitationManager } from "../invitation-manager";

const mockUseCampaignInvitation = jest.fn();
const mockCreateMutate = jest.fn();
const mockRevokeMutate = jest.fn();

jest.mock("@/hooks/use-campaign-invitation", () => ({
  useCampaignInvitation: (...args: unknown[]) =>
    mockUseCampaignInvitation(...args),
}));

jest.mock("@/hooks/use-create-invitation", () => ({
  useCreateInvitation: () => ({
    mutate: mockCreateMutate,
    isPending: false,
  }),
}));

jest.mock("@/hooks/use-revoke-invitation", () => ({
  useRevokeInvitation: () => ({
    mutate: mockRevokeMutate,
    isPending: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe("InvitationManager", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render empty state when no invitation exists", () => {
    mockUseCampaignInvitation.mockReturnValue({
      invitation: null,
      isLoading: false,
      isError: false,
    });

    render(<InvitationManager campaignId="campaign-456" />, {
      wrapper: createWrapper(),
    });

    expect(
      screen.getByText(
        "No invitation link generated yet. Create one to invite players to your campaign."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Generate Invitation Link")).toBeInTheDocument();
  });

  it("should render loading skeleton when loading", () => {
    mockUseCampaignInvitation.mockReturnValue({
      invitation: null,
      isLoading: true,
      isError: false,
    });

    const { container } = render(
      <InvitationManager campaignId="campaign-456" />,
      { wrapper: createWrapper() }
    );

    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render error state when query fails", () => {
    mockUseCampaignInvitation.mockReturnValue({
      invitation: null,
      isLoading: false,
      isError: true,
    });

    render(<InvitationManager campaignId="campaign-456" />, {
      wrapper: createWrapper(),
    });

    expect(
      screen.getByText(
        "Failed to load invitation status. Please refresh the page."
      )
    ).toBeInTheDocument();
  });

  it("should render token-not-recoverable message when invitation exists but URL is unavailable", () => {
    mockUseCampaignInvitation.mockReturnValue({
      invitation: {
        id: "inv-123",
        campaignId: "campaign-456",
        createdAt: "2026-03-01T12:00:00Z",
        expiresAt: "2026-03-08T12:00:00Z",
        status: "active",
      },
      isLoading: false,
      isError: false,
    });

    render(<InvitationManager campaignId="campaign-456" />, {
      wrapper: createWrapper(),
    });

    expect(
      screen.getByText(/token cannot be recovered after creation/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Regenerate/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Revoke/ })).toBeInTheDocument();
  });

  it("should call createInvitation.mutate when generate button is clicked", async () => {
    mockUseCampaignInvitation.mockReturnValue({
      invitation: null,
      isLoading: false,
      isError: false,
    });

    render(<InvitationManager campaignId="campaign-456" />, {
      wrapper: createWrapper(),
    });

    const generateBtn = screen.getByText("Generate Invitation Link");
    await user.click(generateBtn);

    expect(mockCreateMutate).toHaveBeenCalledTimes(1);
    expect(mockCreateMutate).toHaveBeenCalledWith(7, expect.any(Object));
  });

  it("should show regenerate confirmation dialog when regenerate is clicked", async () => {
    mockUseCampaignInvitation.mockReturnValue({
      invitation: {
        id: "inv-123",
        campaignId: "campaign-456",
        createdAt: "2026-03-01T12:00:00Z",
        expiresAt: "2026-03-08T12:00:00Z",
        status: "active",
      },
      isLoading: false,
      isError: false,
    });

    render(<InvitationManager campaignId="campaign-456" />, {
      wrapper: createWrapper(),
    });

    const regenerateBtn = screen.getByRole("button", { name: /Regenerate/ });
    await user.click(regenerateBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Regenerate invitation link?")
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Regenerating will invalidate the current link/)
      ).toBeInTheDocument();
    });
  });

  it("should show revoke confirmation dialog when revoke is clicked", async () => {
    mockUseCampaignInvitation.mockReturnValue({
      invitation: {
        id: "inv-123",
        campaignId: "campaign-456",
        createdAt: "2026-03-01T12:00:00Z",
        expiresAt: "2026-03-08T12:00:00Z",
        status: "active",
      },
      isLoading: false,
      isError: false,
    });

    render(<InvitationManager campaignId="campaign-456" />, {
      wrapper: createWrapper(),
    });

    const revokeBtn = screen.getByText("Revoke");
    await user.click(revokeBtn);

    await waitFor(() => {
      expect(screen.getByText("Revoke invitation link?")).toBeInTheDocument();
      expect(
        screen.getByText(
          /This will permanently invalidate the invitation link/
        )
      ).toBeInTheDocument();
    });
  });

  it("should display mutation error when generate fails", async () => {
    mockUseCampaignInvitation.mockReturnValue({
      invitation: null,
      isLoading: false,
      isError: false,
    });

    mockCreateMutate.mockImplementation(
      (_days: number, options: { onError: () => void }) => {
        options.onError();
      }
    );

    render(<InvitationManager campaignId="campaign-456" />, {
      wrapper: createWrapper(),
    });

    const generateBtn = screen.getByText("Generate Invitation Link");
    await user.click(generateBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Failed to generate invitation link. Please try again."
        )
      ).toBeInTheDocument();
    });
  });
});
