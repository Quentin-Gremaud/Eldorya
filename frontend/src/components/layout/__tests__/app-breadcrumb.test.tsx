import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
});

import { AppBreadcrumb } from "../app-breadcrumb";

describe("AppBreadcrumb", () => {
  it("renders all breadcrumb segments", () => {
    render(
      <AppBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Campaign Name", href: "/campaign/123/player" },
          { label: "Character" },
        ]}
      />
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Campaign Name")).toBeInTheDocument();
    expect(screen.getByText("Character")).toBeInTheDocument();
  });

  it("makes parent segments clickable links", () => {
    render(
      <AppBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Campaign Name", href: "/campaign/123/player" },
          { label: "Character" },
        ]}
      />
    );

    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).toHaveAttribute("href", "/dashboard");

    const campaignLink = screen.getByRole("link", { name: "Campaign Name" });
    expect(campaignLink).toHaveAttribute("href", "/campaign/123/player");
  });

  it("renders current page (last item) as non-clickable", () => {
    render(
      <AppBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Character" },
        ]}
      />
    );

    const currentPage = screen.getByText("Character");
    expect(currentPage).toHaveAttribute("aria-current", "page");
  });

  it("has proper navigation role and aria-label", () => {
    render(
      <AppBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings" },
        ]}
      />
    );

    expect(screen.getByLabelText("breadcrumb")).toBeInTheDocument();
  });

  it("renders separators between items", () => {
    const { container } = render(
      <AppBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Campaign", href: "/campaign/123" },
          { label: "Maps" },
        ]}
      />
    );

    const separators = container.querySelectorAll('[data-slot="breadcrumb-separator"]');
    expect(separators).toHaveLength(2);
  });

  it("renders single item as current page without separator", () => {
    const { container } = render(
      <AppBreadcrumb items={[{ label: "Dashboard" }]} />
    );

    expect(screen.getByText("Dashboard")).toHaveAttribute("aria-current", "page");
    const separators = container.querySelectorAll('[data-slot="breadcrumb-separator"]');
    expect(separators).toHaveLength(0);
  });
});
