import { render, screen, fireEvent } from "@testing-library/react";
import { CampaignCard, CampaignCardData } from "../campaign-card";
import { CampaignSummary } from "@/types/api";

jest.mock("date-fns", () => ({
  formatDistanceToNow: () => "3 days ago",
}));

const baseCampaign: CampaignSummary = {
  id: "campaign-1",
  name: "Dragon Quest",
  description: "An epic adventure through dark lands",
  coverImageUrl: "https://example.com/cover.jpg",
  status: "active",
  role: "gm",
  playerCount: 4,
  lastSessionDate: "2026-03-01T10:00:00Z",
  createdAt: "2026-01-01T00:00:00Z",
};

describe("CampaignCard", () => {
  it("renders campaign title", () => {
    render(<CampaignCard campaign={baseCampaign} />);
    expect(screen.getByText("Dragon Quest")).toBeInTheDocument();
  });

  it("renders cover image when provided", () => {
    render(<CampaignCard campaign={baseCampaign} />);
    const img = screen.getByRole("img", { name: /dragon quest cover/i });
    expect(img).toBeInTheDocument();
  });

  it("shows fallback gradient when no cover image", () => {
    const campaign = { ...baseCampaign, coverImageUrl: null };
    const { container } = render(<CampaignCard campaign={campaign} />);
    const fallback = container.querySelector(".bg-gradient-to-br");
    expect(fallback).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("displays player count", () => {
    render(<CampaignCard campaign={baseCampaign} />);
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("shows GM role indicator for GM campaigns", () => {
    render(<CampaignCard campaign={baseCampaign} />);
    expect(screen.getByText("GM")).toBeInTheDocument();
  });

  it("shows Player role indicator for player campaigns", () => {
    const campaign = { ...baseCampaign, role: "player" as const };
    render(<CampaignCard campaign={campaign} />);
    expect(screen.getByText("Player")).toBeInTheDocument();
  });

  it("displays formatted last session date", () => {
    render(<CampaignCard campaign={baseCampaign} />);
    expect(screen.getByText("3 days ago")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(<CampaignCard campaign={baseCampaign} onClick={onClick} />);
    const card = screen.getByText("Dragon Quest").closest("[data-slot='card']");
    fireEvent.click(card!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  describe("player variant with gmDisplayName", () => {
    const playerCampaign: CampaignCardData = {
      id: "campaign-2",
      name: "Sword Coast",
      description: "A player adventure",
      coverImageUrl: null,
      status: "active",
      role: "player",
      playerCount: 5,
      lastSessionDate: null,
      gmDisplayName: "Jane Smith",
    };

    it("displays GM name instead of player count for player campaigns", () => {
      render(<CampaignCard campaign={playerCampaign} />);
      expect(screen.getByText("GM: Jane Smith")).toBeInTheDocument();
      expect(screen.queryByText("5")).toBeNull();
    });

    it("shows Player role badge", () => {
      render(<CampaignCard campaign={playerCampaign} />);
      expect(screen.getByText("Player")).toBeInTheDocument();
    });

    it("navigates to player route when clicked", () => {
      const onClick = jest.fn();
      render(<CampaignCard campaign={playerCampaign} onClick={onClick} />);
      const card = screen.getByText("Sword Coast").closest("[data-slot='card']");
      fireEvent.click(card!);
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
