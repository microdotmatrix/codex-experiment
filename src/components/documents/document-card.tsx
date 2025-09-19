"use client";

import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  Eye,
  Lock,
  MessageSquare,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, type ComponentType, type SVGProps } from "react";

import {
  SharedTransition,
  TransitionLink,
} from "@/components/layout/transitions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { DocumentSummary } from "@/lib/db/queries/documents";
import { cn } from "@/lib/utils";

interface DocumentCardProps {
  document: DocumentSummary;
  viewerId: string;
}

export const DocumentCard = ({ document, viewerId }: DocumentCardProps) => {
  const updatedAtDate = useMemo(() => {
    return typeof document.updatedAt === "string"
      ? new Date(document.updatedAt)
      : document.updatedAt;
  }, [document.updatedAt]);

  const lastUpdated = formatDistanceToNow(updatedAtDate, {
    addSuffix: true,
  });

  const isOwner = document.owner.id === viewerId;
  const roleLabel = isOwner
    ? "Owner"
    : document.collaborator?.status === "active"
      ? "Collaborator"
      : "Invited";

  const VisibilityIcon = document.visibility === "public" ? Eye : Lock;

  const highlight = document.pendingSuggestions > 0;

  return (
    <motion.div
      initial={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      whileHover={{ translateY: -4 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <SharedTransition name={`entry-${document.id}`} share="animate-morph">
        <TransitionLink
          href={`/dashboard/documents/${document.id}`}
          type="transition-to-detail"
          className="group block focus-visible:outline-none"
        >
          <Card
            className={cn(
              "relative flex h-full flex-col overflow-hidden border border-border/50 bg-gradient-to-br from-background/90 to-background/60 p-6 shadow transition-colors hover:border-primary/60 hover:shadow-lg focus-visible:border-primary/70",
              highlight && "ring-1 ring-primary/50"
            )}
          >
        <section className="mb-4 flex items-center justify-between">
          <Badge
            variant={document.visibility === "public" ? "secondary" : "outline"}
            className="flex items-center gap-2 text-xs uppercase tracking-wide"
          >
            <VisibilityIcon className="size-3.5" />
            {document.visibility}
          </Badge>
          <Badge variant="outline" className="text-xs uppercase tracking-widest">
            {roleLabel}
          </Badge>
        </section>

        <header className="space-y-2">
          <h3 className="text-2xl font-semibold leading-tight">
            {document.title || "Untitled document"}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {document.summary || "No summary yet — craft a quick mission briefing."}
          </p>
        </header>

        <Separator className="my-4 bg-border/60" />

        <section className="grid grid-cols-3 gap-4 text-sm">
          <Metric
            icon={Users}
            label="Role"
            value={roleLabel}
          />
          <Metric
            icon={MessageSquare}
            label="Total notes"
            value={`${document.commentCount}`}
            emphasize={document.commentCount > 0}
          />
          <Metric
            icon={MessageSquare}
            label="Suggestions"
            value={`${document.pendingSuggestions}`}
            emphasize={document.pendingSuggestions > 0}
          />
        </section>

        <footer className="mt-auto flex items-center justify-between pt-6 text-xs text-muted-foreground">
          <span>Updated {lastUpdated}</span>
          <span className="inline-flex items-center gap-2 text-primary transition-transform duration-200 group-hover:translate-x-1">
            Open workspace
            <ArrowRight className="size-4" />
          </span>
        </footer>
          </Card>
        </TransitionLink>
      </SharedTransition>
    </motion.div>
  );
};

interface MetricProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  emphasize?: boolean;
}

const Metric = ({ icon: Icon, label, value, emphasize }: MetricProps) => {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-2 text-[0.65rem] uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </span>
      <span
        className={cn(
          "text-lg font-semibold",
          emphasize ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
};
