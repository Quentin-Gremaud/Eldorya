"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, Loader2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { characterSchema, RACES, CLASSES, STAT_NAMES } from "./character-form";
import { useModifyCharacterByGm } from "@/hooks/use-modify-character-by-gm";
import type { CharacterSummary, ModifyCharacterByGmPayload } from "@/types/api";

type CharacterFormData = z.infer<typeof characterSchema>;

interface GMCharacterModificationDialogProps {
  campaignId: string;
  character: CharacterSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GMCharacterModificationDialog({
  campaignId,
  character,
  open,
  onOpenChange,
}: GMCharacterModificationDialogProps) {
  const { mutate, isPending } = useModifyCharacterByGm(campaignId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<CharacterFormData>({
    resolver: zodResolver(characterSchema) as any,
    defaultValues: {
      name: character.name,
      race: character.race as CharacterFormData["race"],
      characterClass: character.characterClass as CharacterFormData["characterClass"],
      background: character.background,
      stats: character.stats,
      spells: character.spells.map((s) => ({ value: s })),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: character.name,
        race: character.race as CharacterFormData["race"],
        characterClass: character.characterClass as CharacterFormData["characterClass"],
        background: character.background,
        stats: character.stats,
        spells: character.spells.map((s) => ({ value: s })),
      });
    }
  }, [open, character, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "spells",
  });

  function onSubmit(data: CharacterFormData) {
    const modifications: ModifyCharacterByGmPayload = {};

    if (data.name !== character.name) modifications.name = data.name;
    if (data.race !== character.race) modifications.race = data.race;
    if (data.characterClass !== character.characterClass)
      modifications.characterClass = data.characterClass;
    if (data.background !== character.background)
      modifications.background = data.background;

    const statsChanged = STAT_NAMES.some(
      (s) => data.stats[s] !== character.stats[s]
    );
    if (statsChanged) modifications.stats = data.stats;

    const newSpells = data.spells.map((s) => s.value).filter(Boolean);
    const spellsChanged =
      newSpells.length !== character.spells.length ||
      newSpells.some((s, i) => s !== character.spells[i]);
    if (spellsChanged) modifications.spells = newSpells;

    if (Object.keys(modifications).length === 0) {
      onOpenChange(false);
      return;
    }

    mutate(
      { characterId: character.id, modifications },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modify Character: {character.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Race & Class */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Race</Label>
              <Select
                value={form.watch("race")}
                onValueChange={(v) => form.setValue("race", v as CharacterFormData["race"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RACES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={form.watch("characterClass")}
                onValueChange={(v) => form.setValue("characterClass", v as CharacterFormData["characterClass"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Background */}
          <div className="space-y-2">
            <Label htmlFor="background">Background</Label>
            <Input id="background" {...form.register("background")} />
            {form.formState.errors.background && (
              <p className="text-sm text-red-500">{form.formState.errors.background.message}</p>
            )}
          </div>

          {/* Stats */}
          <div className="space-y-2">
            <Label>Statistics</Label>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
              {STAT_NAMES.map((stat) => (
                <div key={stat} className="space-y-1">
                  <Label className="text-xs uppercase text-muted-foreground">
                    {stat.slice(0, 3).toUpperCase()}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    {...form.register(`stats.${stat}`, { valueAsNumber: true })}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Spells */}
          <div className="space-y-2">
            <Label>Spells</Label>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    {...form.register(`spells.${index}.value`)}
                    placeholder="Spell name"
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
                  <Plus className="size-4 mr-1" />
                  Add Spell
                </Button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
