"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useUploadMapBackground,
  type UploadStatus,
} from "@/hooks/use-upload-map-background";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ImportMapBackgroundButtonProps {
  campaignId: string;
  mapLevelId: string;
}

export function ImportMapBackgroundButton({
  campaignId,
  mapLevelId,
}: ImportMapBackgroundButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, status, isUploading, reset } = useUploadMapBackground(
    campaignId,
    mapLevelId
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be re-selected
    e.target.value = "";

    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Unsupported file format. Please use JPG, PNG, or WebP.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    try {
      await upload(file);
      toast.success("Background image imported!");
    } catch {
      toast.error("Failed to import background image.");
    }
  };

  const statusLabel: Record<UploadStatus, string> = {
    idle: "Import Background",
    uploading: "Uploading...",
    confirming: "Saving...",
    done: "Import Background",
    error: "Import Background",
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="file-input"
      />
      <Button
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => {
          reset();
          fileInputRef.current?.click();
        }}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-1" />
        )}
        {statusLabel[status]}
      </Button>
    </>
  );
}
