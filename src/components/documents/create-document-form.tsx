"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";

import { createDocument } from "@/lib/db/mutations/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/utils";

type CreateDocumentState = ActionState & {
  documentId?: string;
  slug?: string;
};

const initialState: CreateDocumentState = {};

const createDocumentAction = createDocument as unknown as (
  state: CreateDocumentState,
  formData: FormData
) => Promise<CreateDocumentState>;

export const CreateDocumentForm = () => {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<CreateDocumentState, FormData>(
    createDocumentAction,
    initialState
  );

  useEffect(() => {
    if (!state) return;
    if (state.error) {
      toast.error(state.error);
    }
    if (state.success && state.documentId) {
      toast.success(state.success);
      router.push(`/dashboard/documents/${state.documentId}`);
    }
  }, [state, router]);

  return (
    <motion.section
      layout
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background/60 via-background/40 to-primary/10 p-6 shadow-lg",
        "before:absolute before:inset-0 before:-z-10 before:animate-pulse before:bg-[radial-gradient(circle_at_top,_rgba(88,101,242,0.15),_transparent_55%)]"
      )}
    >
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Codename
          </Label>
          <Input
            id="title"
            name="title"
            placeholder="Nebula Protocol"
            required
            minLength={3}
            className="mt-1.5 border-border/70 bg-background/80 backdrop-blur transition focus:border-primary/70"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-[2fr,1fr]">
          <div>
            <Label htmlFor="summary" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Mission Brief
            </Label>
            <Textarea
              id="summary"
              name="summary"
              placeholder="Outline the intent, goals, or collaborators for this document."
              rows={3}
              className="mt-1.5 resize-none border-border/70 bg-background/80"
            />
          </div>
          <div>
            <Label htmlFor="visibility" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Visibility
            </Label>
            <select
              id="visibility"
              name="visibility"
              defaultValue="private"
              className="mt-1.5 w-full rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground shadow-inner outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            >
              <option value="private">Private workspace</option>
              <option value="public">Public showcase</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Launch a blank Markdown canvas and invite collaborators later.</span>
          <Button type="submit" disabled={isPending} className="group">
            {isPending ? "Launching..." : "Create document"}
          </Button>
        </div>
      </form>
    </motion.section>
  );
};
