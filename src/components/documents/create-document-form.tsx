"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createDocument } from "@/lib/db/mutations/documents";
import type { ActionState } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { AnimatedInput } from "../elements/form/animated-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

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
    <motion.div
      layout
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background/60 via-background/40 to-primary/10 p-6 shadow-lg",
        "before:absolute before:inset-0 before:-z-10 before:animate-pulse before:animation-duration-[4s] before:bg-[radial-gradient(circle_at_top,_rgba(88,101,242,0.15),_transparent_55%)]"
      )}
    >
      <form action={formAction} className="space-y-6">
        <div>
          <AnimatedInput
            name="title"
            label="Codename"
            placeholder="Nebula Protocol"
            required
            minLength={3}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-[2fr,1fr]">
          <div>
            <AnimatedInput
              type="textarea"
              label="Mission Brief"
              name="summary"
              placeholder="Outline the intent, goals, or collaborators for this document."
              className="resize-none h-24"
            />
          </div>
          <div>
            <Label htmlFor="visibility" className="text-xs uppercase tracking-[0.3em] text-muted-foreground ml-0.75">
              Visibility
            </Label>
            <Select
              name="visibility"
              defaultValue="private"
            >
              <SelectTrigger className="mt-1 w-full rounded-lg border border-input/50 px-3 py-2 text-sm shadow-inner outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private workspace</SelectItem>
                <SelectItem value="public">Public showcase</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Launch a blank Markdown canvas and invite collaborators later.</span>
          <Button type="submit" disabled={isPending} className="group">
            {isPending ? "Launching..." : "Create document"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};
