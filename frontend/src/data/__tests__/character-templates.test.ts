import { CHARACTER_TEMPLATES, type CharacterTemplate } from "../character-templates";
import { characterSchema } from "@/components/features/characters/character-form";

describe("CHARACTER_TEMPLATES", () => {
  it("should export an array of 6 templates", () => {
    expect(Array.isArray(CHARACTER_TEMPLATES)).toBe(true);
    expect(CHARACTER_TEMPLATES).toHaveLength(6);
  });

  it("should have unique ids", () => {
    const ids = CHARACTER_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have unique names", () => {
    const names = CHARACTER_TEMPLATES.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each([
    ["Warrior", "Human"],
    ["Mage", "Elf"],
    ["Rogue", "Halfling"],
    ["Cleric", "Dwarf"],
    ["Ranger", "Half-Elf"],
    ["Paladin", "Dragonborn"],
  ])("should include a %s (%s) template", (characterClass, race) => {
    const template = CHARACTER_TEMPLATES.find(
      (t) => t.characterClass === characterClass && t.race === race
    );
    expect(template).toBeDefined();
  });

  describe.each(
    CHARACTER_TEMPLATES.map((t) => [t.name, t] as const)
  )("template: %s", (_name, template) => {
    it("should have required fields", () => {
      expect(template.id).toBeTruthy();
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.icon).toBeTruthy();
      expect(template.difficulty).toBe("beginner");
    });

    it("should pass characterSchema validation", () => {
      const formData = {
        name: template.name,
        race: template.race,
        characterClass: template.characterClass,
        background: template.background,
        stats: template.stats,
        spells: template.spells.map((s) => ({ value: s })),
      };

      const result = characterSchema.safeParse(formData);
      expect(result.success).toBe(true);
    });

    it("should have reasonable stat total (around 72)", () => {
      const total = Object.values(template.stats).reduce((a, b) => a + b, 0);
      expect(total).toBeGreaterThanOrEqual(60);
      expect(total).toBeLessThanOrEqual(84);
    });

    it("should have no duplicate spells", () => {
      const spells = template.spells;
      expect(new Set(spells).size).toBe(spells.length);
    });
  });
});
