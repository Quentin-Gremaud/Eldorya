"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HelpCircle, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateCharacter } from "@/hooks/use-create-character";
import { toast } from "sonner";

export const RACES = [
  "Human",
  "Elf",
  "Dwarf",
  "Halfling",
  "Orc",
  "Gnome",
  "Half-Elf",
  "Tiefling",
  "Dragonborn",
] as const;

export const CLASSES = [
  "Warrior",
  "Mage",
  "Rogue",
  "Cleric",
  "Ranger",
  "Paladin",
  "Bard",
  "Warlock",
  "Druid",
  "Monk",
] as const;

const STAT_TOOLTIPS: Record<string, string> = {
  strength: "Determines melee attack power and carrying capacity.",
  dexterity: "Affects ranged attacks, stealth, and reflexes.",
  constitution: "Determines hit points and resistance to physical effects.",
  intelligence: "Affects arcane spellcasting and knowledge checks.",
  wisdom: "Affects divine spellcasting, perception, and insight.",
  charisma:
    "Affects social interactions, persuasion, and some spellcasting.",
};

export const STAT_NAMES = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

export const characterSchema = z.object({
  name: z
    .string()
    .min(1, "Character name is required")
    .max(50, "Name cannot exceed 50 characters"),
  race: z.enum(RACES, { error: "Please select a race" }),
  characterClass: z.enum(CLASSES, {
    error: "Please select a class",
  }),
  background: z
    .string()
    .min(1, "Background is required")
    .max(100, "Background cannot exceed 100 characters"),
  stats: z.object({
    strength: z.coerce
      .number()
      .int("Must be a whole number")
      .min(1, "Min 1")
      .max(20, "Max 20"),
    dexterity: z.coerce
      .number()
      .int("Must be a whole number")
      .min(1, "Min 1")
      .max(20, "Max 20"),
    constitution: z.coerce
      .number()
      .int("Must be a whole number")
      .min(1, "Min 1")
      .max(20, "Max 20"),
    intelligence: z.coerce
      .number()
      .int("Must be a whole number")
      .min(1, "Min 1")
      .max(20, "Max 20"),
    wisdom: z.coerce
      .number()
      .int("Must be a whole number")
      .min(1, "Min 1")
      .max(20, "Max 20"),
    charisma: z.coerce
      .number()
      .int("Must be a whole number")
      .min(1, "Min 1")
      .max(20, "Max 20"),
  }),
  spells: z
    .array(z.object({ value: z.string().max(50, "Spell name too long") }))
    .max(20, "Maximum 20 spells"),
});

type CharacterFormData = z.infer<typeof characterSchema>;

export type CharacterFormValues = CharacterFormData;

interface CharacterFormProps {
  campaignId: string;
  onSuccess: () => void;
  initialValues?: Partial<CharacterFormData>;
}

function FieldTooltip({ content }: { content: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="text-muted-foreground hover:text-foreground">
          <HelpCircle className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

export function CharacterForm({ campaignId, onSuccess, initialValues }: CharacterFormProps) {
  const createCharacter = useCreateCharacter(campaignId);

  const defaults: CharacterFormData = {
    name: "",
    race: undefined as unknown as (typeof RACES)[number],
    characterClass: undefined as unknown as (typeof CLASSES)[number],
    background: "",
    stats: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    spells: [],
  };

  const mergedDefaults = {
    ...defaults,
    ...initialValues,
    stats: { ...defaults.stats, ...initialValues?.stats },
    spells: initialValues?.spells ?? defaults.spells,
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CharacterFormData>({
    resolver: zodResolver(characterSchema) as any,
    defaultValues: mergedDefaults,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "spells",
  });

  const onSubmit = (data: CharacterFormData) => {
    const id = crypto.randomUUID();
    createCharacter.mutate(
      {
        id,
        name: data.name,
        race: data.race,
        characterClass: data.characterClass,
        background: data.background,
        stats: data.stats,
        spells: data.spells.map((s) => s.value).filter(Boolean),
      },
      {
        onSuccess: () => {
          toast.success("Character submitted for GM approval!");
          onSuccess();
        },
        onError: (err) => {
          toast.error(
            "Failed to submit character",
            {
              description:
                err && typeof err === "object" && "message" in err
                  ? (err as { message: string }).message
                  : "Please try again.",
            }
          );
        },
      }
    );
  };

  return (
    <Card className="bg-surface-elevated">
      <CardHeader>
        <CardTitle className="text-xl">Create Your Character</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="char-name">Name</Label>
              <FieldTooltip content="Your character's name in the game world. Choose something memorable!" />
            </div>
            <Input
              id="char-name"
              placeholder="Enter character name"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Race */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Race</Label>
              <FieldTooltip content="Your character's species. Each race has unique cultural traits and abilities." />
            </div>
            <Select
              defaultValue={mergedDefaults.race}
              onValueChange={(value) =>
                setValue("race", value as (typeof RACES)[number], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a race" />
              </SelectTrigger>
              <SelectContent>
                {RACES.map((race) => (
                  <SelectItem key={race} value={race}>
                    {race}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.race && (
              <p className="text-sm text-destructive" role="alert">
                {errors.race.message}
              </p>
            )}
          </div>

          {/* Class */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Class</Label>
              <FieldTooltip content="Your character's profession. This determines your combat style and abilities." />
            </div>
            <Select
              defaultValue={mergedDefaults.characterClass}
              onValueChange={(value) =>
                setValue(
                  "characterClass",
                  value as (typeof CLASSES)[number],
                  { shouldValidate: true }
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {CLASSES.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.characterClass && (
              <p className="text-sm text-destructive" role="alert">
                {errors.characterClass.message}
              </p>
            )}
          </div>

          {/* Background */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="char-background">Background</Label>
              <FieldTooltip content="A brief backstory for your character. Where do they come from? What drives them?" />
            </div>
            <Input
              id="char-background"
              placeholder="Describe your character's background"
              {...register("background")}
              aria-invalid={!!errors.background}
            />
            {errors.background && (
              <p className="text-sm text-destructive" role="alert">
                {errors.background.message}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <Label>Statistics</Label>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {STAT_NAMES.map((stat) => (
                <div key={stat} className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor={`stat-${stat}`} className="text-xs capitalize">
                      {stat}
                    </Label>
                    <FieldTooltip content={STAT_TOOLTIPS[stat]} />
                  </div>
                  <Input
                    id={`stat-${stat}`}
                    type="number"
                    min={1}
                    max={20}
                    {...register(`stats.${stat}`, { valueAsNumber: true })}
                    aria-invalid={!!errors.stats?.[stat]}
                  />
                  {errors.stats?.[stat] && (
                    <p className="text-xs text-destructive" role="alert">
                      {errors.stats[stat]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Spells */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label>Spells</Label>
              <FieldTooltip content="Available spells for your character. Leave empty if your class doesn't use magic." />
            </div>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    placeholder={`Spell ${index + 1}`}
                    {...register(`spells.${index}.value`)}
                    aria-invalid={!!errors.spells?.[index]?.value}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              {fields.length < 20 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ value: "" })}
                >
                  <Plus className="mr-1 size-4" />
                  Add Spell
                </Button>
              )}
            </div>
            {errors.spells && (
              <p className="text-sm text-destructive" role="alert">
                {typeof errors.spells.message === "string"
                  ? errors.spells.message
                  : "Invalid spells"}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={createCharacter.isPending}
            className="w-full"
          >
            {createCharacter.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Character for Approval"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
