"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { UploadButton } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const MAX_UPLOADS = 8;

interface EntryGalleryUploaderProps {
  entryId: string;
  currentCount: number;
}

export const EntryGalleryUploader = ({ entryId, currentCount }: EntryGalleryUploaderProps) => {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const remaining = useMemo(() => Math.max(0, MAX_UPLOADS - currentCount), [currentCount]);

  return (
    <Card className="flex flex-col gap-4 border border-dashed border-border/60 bg-background/70 p-6">
      <header className="space-y-1">
        <h3 className="text-base font-semibold">Gallery uploads</h3>
        <p className="text-sm text-muted-foreground">
          Add up to {MAX_UPLOADS} images per entry. Each upload appears instantly in the gallery below.
        </p>
      </header>

      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        <span>
          {remaining > 0
            ? `${remaining} additional ${remaining === 1 ? "upload" : "uploads"} remaining.`
            : "You have reached the gallery limit for this entry."}
        </span>
        {isUploading ? <span className="text-xs text-primary">Uploading...</span> : null}
      </div>

      {remaining <= 0 ? null : (
        <UploadButton
          endpoint="entryGalleryImage"
          input={{ entryId }}
          onUploadBegin={() => {
            setIsUploading(true);
          }}
          onUploadProgress={() => {
            if (!isUploading) {
              setIsUploading(true);
            }
          }}
          onClientUploadComplete={() => {
            setIsUploading(false);
            toast.success("Image uploaded");
            router.refresh();
          }}
          onUploadError={(error: Error) => {
            setIsUploading(false);
            toast.error(error.message ?? "Upload failed");
          }}
          appearance={{
            button: cn(
              "rounded-xl border border-border bg-primary/10 px-4 py-3 text-sm font-medium text-primary shadow-sm transition hover:bg-primary/20",
              isUploading && "opacity-70"
            ),
          }}
          content={{
            button({ ready }: { ready: boolean }) {
              return ready ? "Upload to gallery" : "Preparing uploader...";
            },
          }}
        />
      )}
    </Card>
  );
};
