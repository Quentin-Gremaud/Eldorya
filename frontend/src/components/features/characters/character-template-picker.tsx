"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sword,
  Sparkles,
  EyeOff,
  HeartPulse,
  Trees,
  Shield,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  CHARACTER_TEMPLATES,
  type CharacterTemplate,
} from "@/data/character-templates";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  sword: Sword,
  sparkles: Sparkles,
  "eye-off": EyeOff,
  "heart-pulse": HeartPulse,
  trees: Trees,
  shield: Shield,
};

const STAT_ABBR: Record<string, string> = {
  strength: "STR",
  dexterity: "DEX",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "WIS",
  charisma: "CHA",
};

interface CharacterTemplatePickerProps {
  onSelectTemplate: (template: CharacterTemplate) => void;
  onStartFromScratch: () => void;
  templates?: CharacterTemplate[];
}

export function CharacterTemplatePicker({
  onSelectTemplate,
  onStartFromScratch,
  templates = CHARACTER_TEMPLATES,
}: CharacterTemplatePickerProps) {
  const [hasError, setHasError] = useState(false);

  const handleKeyDown = (
    e: React.KeyboardEvent,
    action: () => void
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  if (hasError || !templates || templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
        <AlertCircle className="mb-4 size-10 text-destructive" />
        <h3 className="text-lg font-semibold">
          Failed to load character templates
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Something went wrong while loading the templates.
        </p>
        <div className="mt-4 flex gap-3">
          <Button
            variant="outline"
            onClick={() => setHasError(false)}
          >
            Retry
          </Button>
          <Button onClick={onStartFromScratch}>
            Start from Scratch
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold">Choose Your Character</h2>
      <p className="mb-6 text-muted-foreground">
        Pick a template to get started quickly, or create your own from scratch.
      </p>
      <div
        role="listbox"
        aria-label="Character templates"
        className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
      >
        {templates.map((template) => {
          const Icon = ICON_MAP[template.icon];
          return (
            <Card
              key={template.id}
              role="option"
              aria-selected={false}
              aria-label={`${template.name} - ${template.race} ${template.characterClass}`}
              tabIndex={0}
              onClick={() => onSelectTemplate(template)}
              onKeyDown={(e) =>
                handleKeyDown(e, () => onSelectTemplate(template))
              }
              className="flex cursor-pointer flex-col transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="size-5 text-emerald-500" />}
                    <CardTitle className="text-lg font-semibold">
                      {template.name}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary">{template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {template.race} {template.characterClass}
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <p className="text-sm">{template.description}</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(template.stats).map(([stat, value]) => (
                    <span
                      key={stat}
                      className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium"
                    >
                      {STAT_ABBR[stat]} {value}
                    </span>
                  ))}
                </div>
                <Button size="sm" className="w-full" tabIndex={-1}>
                  Select
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {/* Start from scratch card */}
        <Card
          role="option"
          aria-selected={false}
          aria-label="Start from Scratch - Create a custom character"
          tabIndex={0}
          onKeyDown={(e) => handleKeyDown(e, onStartFromScratch)}
          onClick={onStartFromScratch}
          className="flex cursor-pointer flex-col border-dashed transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">
                Start from Scratch
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-end">
            <p className="mb-4 text-sm text-muted-foreground">
              Create a fully custom character with a blank form and helpful
              tooltips to guide you.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Create Custom
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
