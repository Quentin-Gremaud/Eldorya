"use client";

import { useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "@clerk/nextjs";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSendAnnouncement } from "@/hooks/use-send-announcement";

const announcementSchema = z.object({
  content: z
    .string()
    .min(1, "Announcement cannot be empty")
    .max(2000, "Announcement cannot exceed 2000 characters"),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

function CharacterCount({
  control,
}: {
  control: Control<AnnouncementFormData>;
}) {
  const content = useWatch({ control, name: "content" });
  const count = content?.length ?? 0;

  return (
    <span
      className={`text-xs ${
        count > 1800 ? "text-amber-400" : "text-text-muted"
      }`}
    >
      {count}/2000
    </span>
  );
}

interface AnnouncementComposerProps {
  campaignId: string;
}

export function AnnouncementComposer({
  campaignId,
}: AnnouncementComposerProps) {
  const { user } = useUser();
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "You";
  const mutation = useSendAnnouncement(campaignId, displayName);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { content: "" },
  });

  const onSubmit = (data: AnnouncementFormData) => {
    const announcementId = crypto.randomUUID();
    mutation.mutate(
      { id: announcementId, content: data.content },
      {
        onSuccess: () => {
          reset();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Textarea
        {...register("content")}
        placeholder="Write an announcement for your players..."
        className="min-h-[100px] resize-none"
        maxLength={2000}
        disabled={mutation.isPending}
        aria-invalid={!!errors.content}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CharacterCount control={control} />
          {errors.content && (
            <span className="text-xs text-red-400">
              {errors.content.message}
            </span>
          )}
          {mutation.isError && (
            <span className="text-xs text-red-400">
              Failed to send announcement. Please try again.
            </span>
          )}
        </div>

        <Button
          type="submit"
          size="sm"
          disabled={mutation.isPending || !isDirty}
        >
          {mutation.isPending ? (
            "Sending..."
          ) : (
            <>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Send Announcement
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
