import { render, screen } from "@testing-library/react";
import GmChatPage from "../page";

describe("GmChatPage", () => {
  it("should render Session Chat heading", () => {
    render(<GmChatPage />);
    expect(screen.getByText("Session Chat")).toBeInTheDocument();
  });

  it("should show coming soon message", () => {
    render(<GmChatPage />);
    expect(screen.getByText("Coming in epic 7")).toBeInTheDocument();
  });
});
