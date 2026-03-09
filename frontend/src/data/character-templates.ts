import type { CharacterStats } from "@/types/api";

export type CharacterRace = "Human" | "Elf" | "Dwarf" | "Halfling" | "Orc" | "Gnome" | "Half-Elf" | "Tiefling" | "Dragonborn";
export type CharacterClass = "Warrior" | "Mage" | "Rogue" | "Cleric" | "Ranger" | "Paladin" | "Bard" | "Warlock" | "Druid" | "Monk";

export interface CharacterTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: "beginner" | "intermediate";
  race: CharacterRace;
  characterClass: CharacterClass;
  background: string;
  stats: CharacterStats;
  spells: string[];
}

export const CHARACTER_TEMPLATES: CharacterTemplate[] = [
  {
    id: "warrior-human",
    name: "Fearless Warrior",
    description: "A strong and resilient fighter, ready for frontline combat.",
    icon: "sword",
    difficulty: "beginner",
    race: "Human",
    characterClass: "Warrior",
    background: "Trained in the royal guard since childhood.",
    stats: { strength: 16, dexterity: 12, constitution: 14, intelligence: 8, wisdom: 10, charisma: 12 },
    spells: [],
  },
  {
    id: "mage-elf",
    name: "Arcane Scholar",
    description: "A wise elf who channels powerful arcane magic.",
    icon: "sparkles",
    difficulty: "beginner",
    race: "Elf",
    characterClass: "Mage",
    background: "Studied ancient arcane arts at the elven academy.",
    stats: { strength: 6, dexterity: 12, constitution: 10, intelligence: 18, wisdom: 14, charisma: 12 },
    spells: ["Magic Missile", "Shield", "Detect Magic"],
  },
  {
    id: "rogue-halfling",
    name: "Shadow Trickster",
    description: "A nimble halfling who excels at stealth and cunning.",
    icon: "eye-off",
    difficulty: "beginner",
    race: "Halfling",
    characterClass: "Rogue",
    background: "Grew up on the streets, mastering the art of subtlety.",
    stats: { strength: 8, dexterity: 18, constitution: 10, intelligence: 12, wisdom: 10, charisma: 14 },
    spells: [],
  },
  {
    id: "cleric-dwarf",
    name: "Divine Guardian",
    description: "A steadfast dwarf blessed with divine healing powers.",
    icon: "heart-pulse",
    difficulty: "beginner",
    race: "Dwarf",
    characterClass: "Cleric",
    background: "Devoted servant of the mountain temple since youth.",
    stats: { strength: 12, dexterity: 8, constitution: 16, intelligence: 10, wisdom: 16, charisma: 10 },
    spells: ["Cure Wounds", "Bless", "Sacred Flame"],
  },
  {
    id: "ranger-half-elf",
    name: "Woodland Sentinel",
    description: "A versatile tracker at home in the wilderness.",
    icon: "trees",
    difficulty: "beginner",
    race: "Half-Elf",
    characterClass: "Ranger",
    background: "Raised among the forest wardens of the borderlands.",
    stats: { strength: 12, dexterity: 16, constitution: 12, intelligence: 10, wisdom: 14, charisma: 8 },
    spells: ["Hunter's Mark", "Cure Wounds"],
  },
  {
    id: "paladin-dragonborn",
    name: "Oath Keeper",
    description: "A mighty dragonborn sworn to uphold justice and valor.",
    icon: "shield",
    difficulty: "beginner",
    race: "Dragonborn",
    characterClass: "Paladin",
    background: "Took a sacred oath to defend the weak and punish evil.",
    stats: { strength: 16, dexterity: 8, constitution: 12, intelligence: 8, wisdom: 12, charisma: 16 },
    spells: ["Divine Smite", "Lay on Hands"],
  },
];
