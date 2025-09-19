"use client";

import { useActionState, useEffect } from "react";
import { motion } from "motion/react";
import { Eye, Lock } from "lucide-react";
import { toast } from "sonner";

import { toggleDocumentVisibility } from "@/lib/db/mutations/documents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ActionState } from "@/lib/utils";

type VisibilityState = ActionState;

const initialState: VisibilityState = {};

const toggleDocumentVisibilityAction = toggleDocumentVisibility as unknown as (
  state: VisibilityState,
  formData: FormData
) => Promise<VisibilityState>;

interface DocumentVisibilityToggleProps {
  documentId: string;
  visibility: "public" | "private";
}

export const DocumentVisibilityToggle = ({
  documentId,
  visibility,
}: DocumentVisibilityToggleProps) => {
  const nextVisibility = visibility === "public" ? "private" : "public";
  const Icon = visibility === "public" ? Eye : Lock;
  const [state, formAction, isPending] = useActionState<VisibilityState, FormData>(
    toggleDocumentVisibilityAction,
    initialState
  );

  useEffect(() => {
    if (!state) return;
    if (state.error) toast.error(state.error);
    if (state.success) toast.success(state.success);
  }, [state]);

  return (
    <motion.form
      action={formAction}
      layout
      className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-background/60 p-4"
    >
      <div className="flex items-center gap-3 text-sm">
        <Badge variant={visibility === "public" ? "secondary" : "outline"}>
          <Icon className="mr-2 size-3.5" />
          {visibility === "public" ? "Public" : "Private"}
        </Badge>
        <span className="text-muted-foreground">
          {visibility === "public"
            ? "Accessible via share link."
            : "Only visible to collaborators."}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input type="hidden" name="documentId" value={documentId} />
        <input type="hidden" name="visibility" value={nextVisibility} />
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          {isPending
            ? "Updating..."
            : nextVisibility === "public"
              ? "Publish"
              : "Make private"}
        </Button>
      </div>
    </motion.form>
  );
};
