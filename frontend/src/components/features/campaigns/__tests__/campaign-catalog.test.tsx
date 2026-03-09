import { render, screen } from "@testing-library/react";
import { CampaignCatalog } from "../campaign-catalog";
import { CampaignSummary, PlayerCampaign } from "@/types/api";

jest.mock("date-fns", () => ({
  formatDistanceToNow: () => "2 days ago",
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const gmCampaign: CampaignSummary = {
  id: "gm-1",
  name: "GM Campaign",
  description: "I run this",
  coverImageUrl: null,
  status: "active",
  role: "gm",
  playerCount: 4,
  lastSessionDate: "2026-03-01T10:00:00Z",
  createdAt: "2026-01-01T00:00:00Z",
};

const playerCampaign: PlayerCampaign = {
  id: "player-1",
  name: "Player Campaign",
  description: "I play in this",
  coverImageUrl: null,
  status: "active",
  role: "player",
  gmDisplayName: "John Doe",
  playerCount: 5,
  lastSessionDate: null,
};

const archivedCampaign: CampaignSummary = {
  id: "archived-1",
  name: "Archived Campaign",
  description: "Done",
  coverImageUrl: null,
  status: "archived",
  role: "gm",
  playerCount: 3,
  lastSessionDate: "2026-01-15T10:00:00Z",
  createdAt: "2025-06-01T00:00:00Z",
};

describe("CampaignCatalog", () => {
  it("shows global empty state when zero campaigns", () => {
    render(<CampaignCatalog campaigns={[]} />);
    expect(screen.getByText("No campaigns yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create your first campaign or join one to get started!"
      )
    ).toBeInTheDocument();
  });

  it('renders "My Campaigns (as GM)" row when GM campaigns exist', () => {
    render(<CampaignCatalog campaigns={[gmCampaign]} />);
    expect(screen.getByText("My Campaigns (as GM)")).toBeInTheDocument();
    expect(screen.getByText("GM Campaign")).toBeInTheDocument();
  });

  it('renders "Campaigns I Play In" row when player campaigns are provided', () => {
    render(
      <CampaignCatalog
        campaigns={[gmCampaign]}
        playerCampaigns={[playerCampaign]}
      />
    );
    expect(screen.getByText("Campaigns I Play In")).toBeInTheDocument();
    expect(screen.getByText("Player Campaign")).toBeInTheDocument();
  });

  it('renders "Archived" row when archived campaigns exist', () => {
    render(<CampaignCatalog campaigns={[archivedCampaign]} />);
    expect(screen.getByRole("heading", { name: "Archived" })).toBeInTheDocument();
    expect(screen.getByText("Archived Campaign")).toBeInTheDocument();
  });

  it("groups campaigns by role correctly", () => {
    render(
      <CampaignCatalog
        campaigns={[gmCampaign, archivedCampaign]}
        playerCampaigns={[playerCampaign]}
      />
    );
    expect(screen.getByText("My Campaigns (as GM)")).toBeInTheDocument();
    expect(screen.getByText("Campaigns I Play In")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Archived" })).toBeInTheDocument();
    expect(screen.getByText("GM Campaign")).toBeInTheDocument();
    expect(screen.getByText("Player Campaign")).toBeInTheDocument();
    expect(screen.getByText("Archived Campaign")).toBeInTheDocument();
  });

  it("does not render empty category rows", () => {
    render(<CampaignCatalog campaigns={[gmCampaign]} />);
    expect(screen.queryByText("Archived")).toBeNull();
  });

  it("shows empty state for player campaigns when GM campaigns exist but no player campaigns", () => {
    render(<CampaignCatalog campaigns={[gmCampaign]} playerCampaigns={[]} />);
    expect(screen.getByText("You haven't joined any campaigns yet")).toBeInTheDocument();
    expect(
      screen.getByText("Ask your GM for an invitation link to get started")
    ).toBeInTheDocument();
  });

  it("shows CTA button in empty state when onCreateCampaign is provided", () => {
    const onCreateCampaign = jest.fn();
    render(
      <CampaignCatalog campaigns={[]} onCreateCampaign={onCreateCampaign} />
    );
    const ctaButton = screen.getByText("Create your first campaign");
    expect(ctaButton).toBeInTheDocument();
  });

  it("hides CTA button in empty state when onCreateCampaign is not provided", () => {
    render(<CampaignCatalog campaigns={[]} />);
    expect(screen.queryByText("Create your first campaign")).toBeNull();
  });

  it("renders all campaign cards in a category row", () => {
    const manyCampaigns = Array.from({ length: 7 }, (_, i) => ({
      ...gmCampaign,
      id: `gm-${i}`,
      name: `GM Campaign ${i}`,
    }));
    render(<CampaignCatalog campaigns={manyCampaigns} />);
    expect(screen.getByText("GM Campaign 0")).toBeInTheDocument();
    expect(screen.getByText("GM Campaign 6")).toBeInTheDocument();
  });

  it("does not show player empty state when player campaigns are loading", () => {
    render(
      <CampaignCatalog
        campaigns={[gmCampaign]}
        playerCampaigns={[]}
        isPlayerLoading={true}
      />
    );
    expect(
      screen.queryByText("You haven't joined any campaigns yet")
    ).toBeNull();
  });
});
