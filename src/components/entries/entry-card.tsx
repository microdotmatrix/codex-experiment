"use client";

import { format, formatDistanceToNow, parseISO } from "date-fns";
import { MapPin, HeartPulse, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

import { CachedImage } from "@/components/elements/image-cache";
import { SharedTransition, TransitionLink } from "@/components/layout/transitions";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { EntrySummary } from "@/lib/db/queries/entries";

interface EntryCardProps {
  entry: EntrySummary;
}

const formatDate = (value: string) => {
  try {
    const date = parseISO(value);
    return format(date, "MMMM d, yyyy");
  } catch (error) {
    return value;
  }
};

export const EntryCard = ({ entry }: EntryCardProps) => {
  const updatedAt = formatDistanceToNow(parseISO(entry.updatedAt), { addSuffix: true });
  const birthDate = formatDate(entry.birthDate);
  const deathDate = formatDate(entry.deathDate);

  return (
    <motion.div
      initial={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      whileHover={{ translateY: -4 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <SharedTransition name={`entry-${entry.id}`} share="animate-morph">
        <TransitionLink
          href={`/dashboard/entries/${entry.id}`}
          type="transition-to-detail"
          className="group block focus-visible:outline-none"
        >
          <Card className="relative flex h-full flex-col overflow-hidden border border-border/50 bg-gradient-to-br from-background/90 to-background/60 shadow transition-colors hover:border-primary/60 hover:shadow-lg">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
              {entry.primaryImageUrl ? (
                <CachedImage
                  src={entry.primaryImageUrl}
                  alt={`${entry.name} portrait`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  No image yet
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-4 p-6">
              <header className="space-y-1">
                <h3 className="text-2xl font-semibold leading-tight">{entry.name}</h3>
                <p className="text-sm text-muted-foreground">{birthDate} – {deathDate}</p>
              </header>

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {entry.location ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/80 px-3 py-1 text-xs uppercase tracking-wide">
                    <MapPin className="size-3.5" />
                    {entry.location}
                  </span>
                ) : null}
                {entry.causeOfDeath ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/80 px-3 py-1 text-xs uppercase tracking-wide">
                    <HeartPulse className="size-3.5" />
                    {entry.causeOfDeath}
                  </span>
                ) : null}
              </div>

              <Separator className="bg-border/60" />

              <footer className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                <span>Updated {updatedAt}</span>
                <span className="inline-flex items-center gap-2 text-primary transition-transform duration-200 group-hover:translate-x-1">
                  View entry
                  <ArrowRight className="size-4" />
                </span>
              </footer>
            </div>
          </Card>
        </TransitionLink>
      </SharedTransition>
    </motion.div>
  );
};
