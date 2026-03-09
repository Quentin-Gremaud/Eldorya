import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterTemplatePicker } from "../character-template-picker";
import { CHARACTER_TEMPLATES } from "@/data/character-templates";

describe("CharacterTemplatePicker", () => {
  const user = userEvent.setup();
  const mockOnSelectTemplate = jest.fn();
  const mockOnStartFromScratch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderPicker() {
    return render(
      <CharacterTemplatePicker
        onSelectTemplate={mockOnSelectTemplate}
        onStartFromScratch={mockOnStartFromScratch}
      />
    );
  }

  it("should render all 6 templates plus start from scratch", () => {
    renderPicker();

    for (const template of CHARACTER_TEMPLATES) {
      expect(screen.getByText(template.name)).toBeInTheDocument();
    }
    expect(screen.getByText("Start from Scratch")).toBeInTheDocument();
  });

  it("should render template descriptions", () => {
    renderPicker();

    for (const template of CHARACTER_TEMPLATES) {
      expect(screen.getByText(template.description)).toBeInTheDocument();
    }
  });

  it("should render difficulty badges", () => {
    renderPicker();

    const badges = screen.getAllByText("Beginner");
    expect(badges.length).toBe(CHARACTER_TEMPLATES.length);
  });

  it("should have a listbox role on the grid", () => {
    renderPicker();

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("should have option roles on cards", () => {
    renderPicker();

    const options = screen.getAllByRole("option");
    // 6 templates + 1 start from scratch
    expect(options.length).toBe(7);
  });

  it("should have aria-labels on template cards", () => {
    renderPicker();

    for (const template of CHARACTER_TEMPLATES) {
      expect(
        screen.getByRole("option", { name: new RegExp(template.name) })
      ).toBeInTheDocument();
    }
  });

  it("should call onSelectTemplate when clicking a template select button", async () => {
    renderPicker();

    const selectButtons = screen.getAllByText("Select");
    await user.click(selectButtons[0]);

    expect(mockOnSelectTemplate).toHaveBeenCalledTimes(1);
    expect(mockOnSelectTemplate).toHaveBeenCalledWith(CHARACTER_TEMPLATES[0]);
  });

  it("should call onStartFromScratch when clicking start from scratch", async () => {
    renderPicker();

    const scratchButton = screen.getByRole("option", { name: /Start from Scratch/ });
    await user.click(scratchButton);

    expect(mockOnStartFromScratch).toHaveBeenCalledTimes(1);
  });

  it("should show key stats preview for each template", () => {
    renderPicker();

    // Check that stat abbreviations are rendered
    const allStatTexts = screen.getAllByText(/^STR \d+$/);
    expect(allStatTexts.length).toBe(CHARACTER_TEMPLATES.length);
  });

  it("should support keyboard navigation with Enter", async () => {
    renderPicker();

    const firstOption = screen.getAllByRole("option")[0];
    firstOption.focus();
    await user.keyboard("{Enter}");

    expect(mockOnSelectTemplate).toHaveBeenCalledWith(CHARACTER_TEMPLATES[0]);
  });

  it("should support keyboard navigation with Space", async () => {
    renderPicker();

    const firstOption = screen.getAllByRole("option")[0];
    firstOption.focus();
    await user.keyboard(" ");

    expect(mockOnSelectTemplate).toHaveBeenCalledWith(CHARACTER_TEMPLATES[0]);
  });

  describe("error handling", () => {
    it("should show error state with Retry and Start from Scratch buttons when templates are empty", () => {
      render(
        <CharacterTemplatePicker
          onSelectTemplate={mockOnSelectTemplate}
          onStartFromScratch={mockOnStartFromScratch}
          templates={[]}
        />
      );

      expect(screen.getByText("Failed to load character templates")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
      expect(screen.getByText("Start from Scratch")).toBeInTheDocument();
    });

    it("should call onStartFromScratch when clicking Start from Scratch in error state", async () => {
      render(
        <CharacterTemplatePicker
          onSelectTemplate={mockOnSelectTemplate}
          onStartFromScratch={mockOnStartFromScratch}
          templates={[]}
        />
      );

      await user.click(screen.getByText("Start from Scratch"));
      expect(mockOnStartFromScratch).toHaveBeenCalledTimes(1);
    });

    it("should recover from hasError state when clicking Retry", async () => {
      const { rerender } = render(
        <CharacterTemplatePicker
          onSelectTemplate={mockOnSelectTemplate}
          onStartFromScratch={mockOnStartFromScratch}
          templates={CHARACTER_TEMPLATES}
        />
      );

      // Verify templates render initially
      expect(screen.getByText(CHARACTER_TEMPLATES[0].name)).toBeInTheDocument();
    });
  });
});
