import { render, screen } from "@testing-library/react";
import { CharacterSheet } from "../character-sheet";
import type { CharacterDetail } from "@/types/api";

jest.mock("@/hooks/use-request-character-modification", () => ({
  useRequestCharacterModification: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

const character: CharacterDetail = {
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
  status: "pending",
  rejectionReason: null,
  proposedChanges: null,
  createdAt: "2026-03-01T12:00:00.000Z",
};

describe("CharacterSheet", () => {
  it("should render character name", () => {
    render(<CharacterSheet character={character} campaignId="camp-1" />);

    expect(screen.getByText("Gandalf")).toBeInTheDocument();
  });

  it("should render race and class", () => {
    render(<CharacterSheet character={character} campaignId="camp-1" />);

    expect(screen.getByText("Human")).toBeInTheDocument();
    expect(screen.getByText("Mage")).toBeInTheDocument();
  });

  it("should render background", () => {
    render(<CharacterSheet character={character} campaignId="camp-1" />);

    expect(screen.getByText("A wandering wizard")).toBeInTheDocument();
  });

  it("should render status badge for pending", () => {
    render(<CharacterSheet character={character} campaignId="camp-1" />);

    expect(screen.getByText("Pending GM Validation")).toBeInTheDocument();
  });

  it("should render approved status badge", () => {
    render(
      <CharacterSheet character={{ ...character, status: "approved" }} campaignId="camp-1" />
    );

    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("should render rejected status badge", () => {
    render(
      <CharacterSheet character={{ ...character, status: "rejected" }} campaignId="camp-1" />
    );

    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  it("should render all stat values", () => {
    render(<CharacterSheet character={character} campaignId="camp-1" />);

    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("should render stat labels", () => {
    render(<CharacterSheet character={character} campaignId="camp-1" />);

    expect(screen.getByText("STR")).toBeInTheDocument();
    expect(screen.getByText("DEX")).toBeInTheDocument();
    expect(screen.getByText("CON")).toBeInTheDocument();
    expect(screen.getByText("INT")).toBeInTheDocument();
    expect(screen.getByText("WIS")).toBeInTheDocument();
    expect(screen.getByText("CHA")).toBeInTheDocument();
  });

  it("should render spells", () => {
    render(<CharacterSheet character={character} campaignId="camp-1" />);

    expect(screen.getByText("Fireball")).toBeInTheDocument();
    expect(screen.getByText("Shield")).toBeInTheDocument();
  });

  it("should not render spells section when no spells", () => {
    render(
      <CharacterSheet character={{ ...character, spells: [] }} campaignId="camp-1" />
    );

    expect(screen.queryByText("Spells")).toBeNull();
  });

  it("should show Request Modification button for approved characters", () => {
    render(
      <CharacterSheet character={{ ...character, status: "approved" }} campaignId="camp-1" />
    );

    expect(screen.getByText("Request Modification")).toBeInTheDocument();
  });

  it("should not show Request Modification button for pending characters", () => {
    render(<CharacterSheet character={character} campaignId="camp-1" />);

    expect(screen.queryByText("Request Modification")).toBeNull();
  });

  it("should render pending re-validation status badge", () => {
    render(
      <CharacterSheet
        character={{ ...character, status: "pending_revalidation" }}
        campaignId="camp-1"
      />
    );

    expect(screen.getByText("Pending Re-validation")).toBeInTheDocument();
  });

  it("should show re-validation notice for pending_revalidation status", () => {
    render(
      <CharacterSheet
        character={{ ...character, status: "pending_revalidation" }}
        campaignId="camp-1"
      />
    );

    expect(
      screen.getByText(/modification request is pending GM review/)
    ).toBeInTheDocument();
  });

  it("should not show Request Modification button for pending_revalidation", () => {
    render(
      <CharacterSheet
        character={{ ...character, status: "pending_revalidation" }}
        campaignId="camp-1"
      />
    );

    expect(screen.queryByText("Request Modification")).toBeNull();
  });
});
