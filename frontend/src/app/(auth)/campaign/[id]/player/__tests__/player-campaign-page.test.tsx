import { render, screen, waitFor } from "@testing-library/react";
import { PlayerCampaignContent } from "../page";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock("date-fns", () => ({
  formatDistanceToNow: () => "3 days ago",
}));

const mockUseCampaign = jest.fn();
const mockUseCampaignAnnouncements = jest.fn();

jest.mock("@/hooks/use-campaign", () => ({
  useCampaign: (...args: unknown[]) => mockUseCampaign(...args),
}));

jest.mock("@/hooks/use-campaign-announcements", () => ({
  useCampaignAnnouncements: () => mockUseCampaignAnnouncements(),
}));

describe("PlayerCampaignContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCampaignAnnouncements.mockReturnValue({
      announcements: [],
      totalCount: 0,
      isLoading: false,
      isError: false,
    });
  });

  it("shows loading skeletons while fetching campaign", () => {
    mockUseCampaign.mockReturnValue({
      campaign: null,
      isLoading: true,
      isError: false,
    });

    const { container } = render(
      <PlayerCampaignContent campaignId="campaign-1" />
    );

    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders campaign details when loaded", () => {
    mockUseCampaign.mockReturnValue({
      campaign: {
        id: "campaign-1",
        name: "Dragon Quest",
        description: "An epic adventure",
        coverImageUrl: null,
        status: "active",
        gmDisplayName: "John Doe",
        playerCount: 4,
        lastSessionDate: "2026-03-01T10:00:00Z",
        userRole: "player",
        createdAt: "2026-01-01T00:00:00Z",
      },
      isLoading: false,
      isError: false,
    });

    render(<PlayerCampaignContent campaignId="campaign-1" />);

    expect(screen.getByText("Dragon Quest")).toBeInTheDocument();
    expect(screen.getByText("GM: John Doe")).toBeInTheDocument();
    expect(screen.getByText("4 players")).toBeInTheDocument();
    expect(screen.getByText("An epic adventure")).toBeInTheDocument();
  });

  it("shows placeholder sections for future features", () => {
    mockUseCampaign.mockReturnValue({
      campaign: {
        id: "campaign-1",
        name: "Test Campaign",
        description: null,
        coverImageUrl: null,
        status: "active",
        gmDisplayName: "GM Name",
        playerCount: 2,
        lastSessionDate: null,
        userRole: "player",
        createdAt: "2026-01-01T00:00:00Z",
      },
      isLoading: false,
      isError: false,
    });

    render(<PlayerCampaignContent campaignId="campaign-1" />);

    expect(screen.getByText("Character")).toBeInTheDocument();
    expect(screen.getByText("Map")).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Inventory")).toBeInTheDocument();
  });

  it("redirects to dashboard on error", async () => {
    mockUseCampaign.mockReturnValue({
      campaign: null,
      isLoading: false,
      isError: true,
    });

    render(<PlayerCampaignContent campaignId="campaign-1" />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("passes campaignId to useCampaign hook", () => {
    mockUseCampaign.mockReturnValue({
      campaign: null,
      isLoading: true,
      isError: false,
    });

    render(<PlayerCampaignContent campaignId="my-campaign-id" />);

    expect(mockUseCampaign).toHaveBeenCalledWith("my-campaign-id");
  });
});
