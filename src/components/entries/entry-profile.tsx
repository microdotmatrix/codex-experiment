import { format, parseISO } from "date-fns";
import { CalendarIcon, MapPin, HeartPulse } from "lucide-react";

import { CachedImage } from "@/components/elements/image-cache";
import { EntryGalleryUploader } from "@/components/entries/gallery-uploader";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { EntryDetail } from "@/lib/db/queries/entries";

const formatDate = (value: string) => {
  try {
    const date = parseISO(value);
    return format(date, "MMMM d, yyyy");
  } catch (error) {
    return value;
  }
};

interface EntryProfileProps {
  entry: EntryDetail;
}

export const EntryProfile = ({ entry }: EntryProfileProps) => {
  const primaryUpload = entry.uploads.find((upload) => upload.isPrimary) ?? entry.uploads[0] ?? null;
  const coverImage = entry.primaryImageUrl ?? primaryUpload?.url ?? null;
  const birthDate = formatDate(entry.birthDate);
  const deathDate = formatDate(entry.deathDate);

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden rounded-3xl border border-border/60 bg-background/70 shadow-lg">
            {coverImage ? (
              <CachedImage
                src={coverImage}
                alt={`${entry.name} portrait`}
                className="h-full w-full max-h-[520px] object-cover"
              />
            ) : (
              <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">
                No primary image yet. Upload a portrait to highlight this profile.
              </div>
            )}
          </Card>

          <Card className="space-y-4 rounded-3xl border border-border/60 bg-background/80 p-6 shadow-lg">
            <header className="space-y-2">
              <h1 className="text-3xl font-semibold md:text-4xl">{entry.name}</h1>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="size-4" />
                <span>
                  {birthDate} — {deathDate}
                </span>
              </p>
            </header>
            <Separator className="bg-border/50" />
            <div className="grid gap-3 text-sm text-muted-foreground">
              {entry.location ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs uppercase tracking-wide">
                  <MapPin className="size-3.5" />
                  {entry.location}
                </div>
              ) : null}
              {entry.causeOfDeath ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs uppercase tracking-wide">
                  <HeartPulse className="size-3.5" />
                  {entry.causeOfDeath}
                </div>
              ) : null}
            </div>
            <Separator className="bg-border/50" />
            <div className="text-xs text-muted-foreground">
              Created by {entry.owner.name ?? "you"}. Gallery images update instantly after each upload.
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <EntryGalleryUploader entryId={entry.id} currentCount={entry.uploads.length} />

          <Card className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow">
            <h3 className="text-base font-semibold">Entry details</h3>
            <dl className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between gap-4">
                <dt>Owner</dt>
                <dd className="text-right font-medium text-foreground">
                  {entry.owner.name ?? entry.owner.email}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Created</dt>
                <dd className="text-right font-medium text-foreground">
                  {formatDate(entry.createdAt)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Images</dt>
                <dd className="text-right font-medium text-foreground">
                  {entry.uploads.length} / 8
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Gallery</h2>
          <span className="text-sm text-muted-foreground">{entry.uploads.length} images</span>
        </header>
        {entry.uploads.length === 0 ? (
          <Card className="border border-dashed border-border/60 bg-background/60 p-10 text-center text-sm text-muted-foreground">
            No images yet. Use the uploader above to add memories to this profile.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entry.uploads.map((upload) => (
              <Card
                key={upload.id}
                className="overflow-hidden border border-border/60 bg-background/70 shadow-sm"
              >
                <CachedImage
                  src={upload.url}
                  alt={`${entry.name} gallery image`}
                  className="h-56 w-full object-cover"
                />
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
