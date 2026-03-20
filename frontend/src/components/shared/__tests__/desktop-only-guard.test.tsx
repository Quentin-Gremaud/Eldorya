import { render, screen, act } from "@testing-library/react";
import { DesktopOnlyGuard } from "../desktop-only-guard";

describe("DesktopOnlyGuard", () => {
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  function setViewport(width: number) {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: width,
    });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
  }

  it("should render children when viewport is >= 1280px", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1280,
    });

    render(
      <DesktopOnlyGuard campaignId="camp-1">
        <div>Cockpit Content</div>
      </DesktopOnlyGuard>
    );

    // After useEffect runs, children should appear
    expect(screen.getByText("Cockpit Content")).toBeInTheDocument();
  });

  it("should show warning message when viewport is < 1280px", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    render(
      <DesktopOnlyGuard campaignId="camp-1">
        <div>Cockpit Content</div>
      </DesktopOnlyGuard>
    );

    expect(
      screen.getByText(/cockpit GM nécessite un écran de bureau/)
    ).toBeInTheDocument();
    expect(screen.queryByText("Cockpit Content")).not.toBeInTheDocument();
  });

  it("should provide a link back to campaign", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 800,
    });

    render(
      <DesktopOnlyGuard campaignId="camp-1">
        <div>Cockpit Content</div>
      </DesktopOnlyGuard>
    );

    const link = screen.getByRole("link", { name: /retour/i });
    expect(link).toHaveAttribute("href", "/campaign/camp-1/gm/prep");
  });

  it("should respond to viewport resize", () => {
    setViewport(1280);
    const { rerender } = render(
      <DesktopOnlyGuard campaignId="camp-1">
        <div>Cockpit Content</div>
      </DesktopOnlyGuard>
    );

    expect(screen.getByText("Cockpit Content")).toBeInTheDocument();

    setViewport(1024);
    rerender(
      <DesktopOnlyGuard campaignId="camp-1">
        <div>Cockpit Content</div>
      </DesktopOnlyGuard>
    );

    expect(
      screen.getByText(/cockpit GM nécessite un écran de bureau/)
    ).toBeInTheDocument();
  });
});
