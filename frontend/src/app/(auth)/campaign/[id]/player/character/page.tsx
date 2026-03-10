"use client";

import { use, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMyCharacter } from "@/hooks/use-my-character";
import { useCampaign } from "@/hooks/use-campaign";
import { CharacterForm } from "@/components/features/characters/character-form";
import type { CharacterFormValues } from "@/components/features/characters/character-form";
import { CharacterSheet } from "@/components/features/characters/character-sheet";
import { CharacterTemplatePicker } from "@/components/features/characters/character-template-picker";
import type { CharacterTemplate } from "@/data/character-templates";
import { InventorySection } from "@/components/features/inventory/inventory-section";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import Link from "next/link";

function CharacterPageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function templateToFormValues(
  template: CharacterTemplate
): Partial<CharacterFormValues> {
  return {
    name: template.name,
    race: template.race as CharacterFormValues["race"],
    characterClass:
      template.characterClass as CharacterFormValues["characterClass"],
    background: template.background,
    stats: template.stats,
    spells: template.spells.map((s) => ({ value: s })),
  };
}

function CharacterNavHeader({ campaignId, campaignName }: { campaignId: string; campaignName?: string }) {
  return (
    <div className="mb-4 space-y-2">
      <AppBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: campaignName ?? "Campaign", href: `/campaign/${campaignId}/player` },
          { label: "Character" },
        ]}
      />
      <Button variant="ghost" size="sm" asChild aria-label="Go back">
        <Link href={`/campaign/${campaignId}/player`}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Link>
      </Button>
    </div>
  );
}

export function PlayerCharacterContent({ campaignId }: { campaignId: string }) {
  const { character, isLoading, isError } = useMyCharacter(campaignId);
  const { campaign } = useCampaign(campaignId);
  const queryClient = useQueryClient();
  const [templateStep, setTemplateStep] = useState<"select" | "form">(
    "select"
  );
  const [initialValues, setInitialValues] =
    useState<Partial<CharacterFormValues>>();
  const [isResubmitting, setIsResubmitting] = useState(false);

  const handleSuccess = () => {
    void queryClient.invalidateQueries({
      queryKey: ["campaigns", campaignId, "characters", "me"],
    });
  };

  const handleSelectTemplate = (template: CharacterTemplate) => {
    setInitialValues(templateToFormValues(template));
    setTemplateStep("form");
  };

  const handleStartFromScratch = () => {
    setInitialValues(undefined);
    setTemplateStep("form");
  };

  const handleBackToTemplates = () => {
    setInitialValues(undefined);
    setTemplateStep("select");
  };

  const navHeader = <CharacterNavHeader campaignId={campaignId} campaignName={campaign?.name} />;

  if (isLoading) {
    return (
      <main className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          {navHeader}
          <CharacterPageSkeleton />
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-2xl">
          {navHeader}
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="mb-4 h-10 w-10 text-destructive" />
            <h3 className="text-lg font-semibold">
              Failed to load character data
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Please try again later.
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() =>
                void queryClient.invalidateQueries({
                  queryKey: ["campaigns", campaignId, "characters", "me"],
                })
              }
            >
              Retry
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const handleResubmit = () => {
    if (!character) return;
    setInitialValues({
      name: character.name,
      race: character.race as CharacterFormValues["race"],
      characterClass: character.characterClass as CharacterFormValues["characterClass"],
      background: character.background,
      stats: character.stats,
      spells: character.spells.map((s) => ({ value: s })),
    });
    setIsResubmitting(true);
  };

  if (character && isResubmitting) {
    return (
      <main className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-2xl">
          {navHeader}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => setIsResubmitting(false)}
          >
            <ArrowLeft className="mr-1 size-4" />
            Back to character sheet
          </Button>
          <CharacterForm
            campaignId={campaignId}
            onSuccess={() => {
              setIsResubmitting(false);
              handleSuccess();
            }}
            initialValues={initialValues}
          />
        </div>
      </main>
    );
  }

  if (character) {
    return (
      <main className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-2xl space-y-4">
          {navHeader}
          {character.status === "rejected" && character.rejectionReason && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-sm font-medium text-red-400 mb-1">
                Rejection Feedback from GM
              </p>
              <p className="text-sm text-foreground">
                {character.rejectionReason}
              </p>
            </div>
          )}
          <CharacterSheet character={character} campaignId={campaignId} />
          {character.status === "approved" && (
            <InventorySection
              characterId={character.id}
              // TODO: also restrict based on active session context when available
              isEditable={character.status === "approved"}
            />
          )}
          {character.status === "rejected" && (
            <Button onClick={handleResubmit} className="w-full">
              Edit &amp; Resubmit
            </Button>
          )}
        </div>
      </main>
    );
  }

  if (templateStep === "select") {
    return (
      <main className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          {navHeader}
          <CharacterTemplatePicker
            onSelectTemplate={handleSelectTemplate}
            onStartFromScratch={handleStartFromScratch}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        {navHeader}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={handleBackToTemplates}
        >
          <ArrowLeft className="mr-1 size-4" />
          Back to templates
        </Button>
        <CharacterForm
          campaignId={campaignId}
          onSuccess={handleSuccess}
          initialValues={initialValues}
        />
      </div>
    </main>
  );
}

export default function PlayerCharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = use(params);
  return <PlayerCharacterContent campaignId={campaignId} />;
}
