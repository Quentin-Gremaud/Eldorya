import { render, screen } from "@testing-library/react";
import { FreemiumGateDialog } from "../freemium-gate-dialog";

describe("FreemiumGateDialog", () => {
  it("should render dialog content when open", () => {
    render(
      <FreemiumGateDialog open={true} onOpenChange={jest.fn()} />
    );

    expect(screen.getByText("Campaign limit reached")).toBeInTheDocument();
    expect(
      screen.getByText(/2-campaign limit for free accounts/)
    ).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(
      <FreemiumGateDialog open={false} onOpenChange={jest.fn()} />
    );

    expect(screen.queryByText("Campaign limit reached")).toBeNull();
  });

  it("should show disabled Pro upgrade button", () => {
    render(
      <FreemiumGateDialog open={true} onOpenChange={jest.fn()} />
    );

    const proButton = screen.getByText("Upgrade to Pro (Coming soon)");
    expect(proButton).toBeInTheDocument();
    const button = proButton.closest("button");
    expect(button).toBeInTheDocument();
    expect(button!.hasAttribute("disabled")).toBe(true);
  });
});
