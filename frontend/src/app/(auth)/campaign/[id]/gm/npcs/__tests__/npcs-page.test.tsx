import { render, screen } from "@testing-library/react";
import GmNpcsPage from "../page";

describe("GmNpcsPage", () => {
  it("should render NPC Library heading", () => {
    render(<GmNpcsPage />);
    expect(screen.getByText("NPC Library")).toBeInTheDocument();
  });

  it("should show coming soon message", () => {
    render(<GmNpcsPage />);
    expect(screen.getByText("Coming in story 6b-3")).toBeInTheDocument();
  });
});
