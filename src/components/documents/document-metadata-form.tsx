"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";

import { updateDocumentMetadata } from "@/lib/db/mutations/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/utils";

interface DocumentMetadataFormProps {
  documentId: string;
  title: string;
  summary: string | null;
}

type MetadataState = ActionState;

const initialState: MetadataState = {};

const updateDocumentMetadataAction = updateDocumentMetadata as unknown as (
  state: MetadataState,
  formData: FormData
) => Promise<MetadataState>;

export const DocumentMetadataForm = ({
  documentId,
  title,
  summary,
}: DocumentMetadataFormProps) => {
  const [name, setName] = useState(title);
  const [description, setDescription] = useState(summary ?? "");
  const [state, formAction, isPending] = useActionState<MetadataState, FormData>(
    updateDocumentMetadataAction,
    initialState
  );

  useEffect(() => {
    if (!state) return;
    if (state.error) {
      toast.error(state.error);
    }
    if (state.success) {
      toast.success(state.success);
    }
  }, [state]);

  useEffect(() => {
    setName(title);
  }, [title]);

  useEffect(() => {
    setDescription(summary ?? "");
  }, [summary]);

  return (
    <motion.form
      action={formAction}
      layout
      className="grid gap-4 rounded-xl border border-border/60 bg-background/90 p-6 shadow"
    >
      <input type="hidden" name="documentId" value={documentId} />
      <div className="grid gap-2">
        <Label
          htmlFor="document-title"
          className="text-xs uppercase tracking-[0.35em] text-muted-foreground"
        >
          Codename
        </Label>
        <Input
          id="document-title"
          name="title"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={3}
          className="border-border/70 bg-background/70"
        />
      </div>
      <div className="grid gap-2">
        <Label
          htmlFor="document-summary"
          className="text-xs uppercase tracking-[0.35em] text-muted-foreground"
        >
          Mission brief
        </Label>
        <Textarea
          id="document-summary"
          name="summary"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="resize-none border-border/70 bg-background/70"
        />
      </div>
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        {isPending ? "Updating details..." : "Changes autosync across collaborators."}
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? "Saving" : "Save details"}
        </Button>
      </div>
    </motion.form>
  );
};
