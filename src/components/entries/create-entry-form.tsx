"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "motion/react";

import { createEntry } from "@/lib/db/mutations/entries";
import type { ActionState } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { UploadButton } from "@/lib/uploadthing";
import { AnimatedInput } from "@/components/elements/form/animated-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CachedImage } from "@/components/elements/image-cache";

const MAX_CAUSE_LENGTH = 240;
const MAX_LOCATION_LENGTH = 160;

type CreateEntryState = ActionState & {
  entryId?: string;
  slug?: string;
};

const initialState: CreateEntryState = {};

const createEntryAction = createEntry as unknown as (
  state: CreateEntryState,
  formData: FormData
) => Promise<CreateEntryState>;

interface UploadedImage {
  url: string;
  key: string;
}

export const CreateEntryForm = () => {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<CreateEntryState, FormData>(
    createEntryAction,
    initialState
  );
  const [primaryImage, setPrimaryImage] = useState<UploadedImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const disabled = isPending || isUploading;

  useEffect(() => {
    if (!state) return;

    if (state.error) {
      toast.error(state.error);
    }

    if (state.success && state.entryId) {
      toast.success(state.success);
      setPrimaryImage(null);
      router.push(`/dashboard/entries/${state.entryId}`);
    }
  }, [state, router]);

  const uploadButtonDisabled = useMemo(() => Boolean(primaryImage) || disabled, [
    primaryImage,
    disabled,
  ]);

  return (
    <motion.div
      layout
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background/70 via-background/50 to-primary/10 p-6 shadow-lg",
        "before:absolute before:inset-0 before:-z-10 before:animate-pulse before:animation-duration-[4s] before:bg-[radial-gradient(circle_at_top,_rgba(100,116,255,0.12),_transparent_60%)]"
      )}
    >
      <form action={formAction} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatedInput
            name="name"
            label="Full name"
            placeholder="Ada Lovelace"
            required
            minLength={2}
          />
          <div className="grid gap-2">
            <Label htmlFor="location" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Place of origin
            </Label>
            <Input
              id="location"
              name="location"
              placeholder="London, United Kingdom"
              maxLength={MAX_LOCATION_LENGTH}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="birthDate" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Date of birth
            </Label>
            <Input id="birthDate" name="birthDate" type="date" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deathDate" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Date of death
            </Label>
            <Input id="deathDate" name="deathDate" type="date" required />
          </div>
        </div>

        <div>
          <AnimatedInput
            type="textarea"
            label="Cause of death"
            name="causeOfDeath"
            placeholder="Complications from pneumonia"
            maxLength={MAX_CAUSE_LENGTH}
            className="h-24 resize-none"
          />
        </div>

        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Profile image</h3>
              <p className="text-sm text-muted-foreground">
                Upload a single portrait to serve as the entry&apos;s primary image.
              </p>
            </div>
            {primaryImage ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPrimaryImage(null)}
                disabled={disabled}
              >
                Remove
              </Button>
            ) : null}
          </header>
          <Card className="flex min-h-48 items-center justify-center border border-dashed border-border/60 bg-background/60 p-4">
            {primaryImage ? (
              <CachedImage
                alt="Primary profile"
                src={primaryImage.url}
                className="h-48 w-48 rounded-xl object-cover"
              />
            ) : (
              <UploadButton
                endpoint="entryProfileImage"
                disabled={uploadButtonDisabled}
                onUploadBegin={() => {
                  setIsUploading(true);
                }}
                onUploadProgress={() => {
                  if (!isUploading) {
                    setIsUploading(true);
                  }
                }}
                onClientUploadComplete={(res: Array<{ url: string; key: string }> | undefined) => {
                  setIsUploading(false);
                  const file = res?.[0];
                  if (!file) return;
                  setPrimaryImage({ url: file.url, key: file.key });
                  toast.success("Portrait uploaded");
                }}
                onUploadError={(error: Error) => {
                  setIsUploading(false);
                  toast.error(error.message ?? "Unable to upload image");
                }}
                appearance={{
                  button: cn(
                    "rounded-xl border border-dashed border-border bg-background px-4 py-10 text-center text-sm text-muted-foreground transition hover:border-primary hover:text-primary",
                    disabled && "opacity-60"
                  ),
                  label: "flex flex-col items-center gap-2",
                }}
                content={{
                  button({ ready }: { ready: boolean }) {
                    return ready ? (
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-base font-medium">Upload portrait</span>
                        <span className="text-xs text-muted-foreground">
                          PNG, JPG up to 4MB
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm">Preparing uploader...</span>
                    );
                  },
                }}
              />
            )}
          </Card>
        </section>

        <input type="hidden" name="primaryImageUrl" value={primaryImage?.url ?? ""} />
        <input type="hidden" name="primaryImageKey" value={primaryImage?.key ?? ""} />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Entries can be updated later with more memories and stories.</span>
          <Button type="submit" disabled={disabled || !primaryImage} className="group">
            {isPending ? "Creating..." : "Create entry"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};
