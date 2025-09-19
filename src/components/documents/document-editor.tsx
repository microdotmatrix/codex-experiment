"use client";

import type { Editor, Extension } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { formatDistanceToNow } from "date-fns";
import { RotateCcw, Save } from "lucide-react";
import { motion } from "motion/react";
import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { Markdown } from "tiptap-markdown";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateDocumentContent } from "@/lib/db/mutations/documents";
import type { ActionState } from "@/lib/utils";

interface SelectionSnapshot {
  text: string;
  rawText: string;
  start: number | null;
  end: number | null;
}

interface DocumentEditorProps {
  documentId: string;
  initialContent: string;
  updatedAt: string;
  canEdit: boolean;
  onSelectionChange?: (selection: SelectionSnapshot | null) => void;
}

type EditorActionState = ActionState;

const initialState: EditorActionState = {};

const updateDocumentContentAction = updateDocumentContent as unknown as (
  state: EditorActionState,
  formData: FormData
) => Promise<EditorActionState>;

const getMarkdownFromEditor = (instance: Editor | null) => {
  const storage = instance?.storage as unknown as {
    markdown?: { getMarkdown?: () => string };
  };

  return storage.markdown?.getMarkdown?.() ?? "";
};

export const DocumentEditor = ({
  documentId,
  initialContent,
  updatedAt,
  canEdit,
  onSelectionChange,
}: DocumentEditorProps) => {
  const [markdown, setMarkdown] = useState(initialContent);
  const [state, formAction, isPending] = useActionState<EditorActionState, FormData>(
    updateDocumentContentAction,
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
    setMarkdown(initialContent);
  }, [initialContent]);

  const handleSelection = useCallback(
    (instance: Editor) => {
      if (!onSelectionChange) return;

      const { from, to } = instance.state.selection;
      if (from === to) {
        onSelectionChange(null);
        return;
      }

      const rawText = instance.state.doc.textBetween(from, to, "\n\n");
      const cleaned = rawText.trim();
      if (!cleaned) {
        onSelectionChange(null);
        return;
      }

      const snapshot = getMarkdownFromEditor(instance) || markdown;
      let anchorStart = snapshot.indexOf(rawText);
      if (anchorStart < 0) {
        anchorStart = snapshot.indexOf(cleaned);
      }
      const start = anchorStart >= 0 ? anchorStart : null;
      const end = start != null ? start + rawText.length : null;

      onSelectionChange({
        text: cleaned,
        rawText,
        start,
        end,
      });
    },
    [onSelectionChange, markdown]
  );

  const extensions = useMemo<Extension[]>(() => {
    const base: Extension[] = [
      StarterKit.configure({
        codeBlock: {
          HTMLAttributes: {
            class: "rounded-lg bg-muted p-4 font-mono text-sm",
          },
        },
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        transformPastedText: canEdit,
      }),
    ];

    if (canEdit) {
      base.push(
        Placeholder.configure({
          placeholder: "Type Markdown, drop in snippets, or paste docs to transform...",
          emptyEditorClass: "is-editor-empty",
        })
      );
    }

    return base;
  }, [canEdit]);

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      content: initialContent,
      editable: canEdit,
      editorProps: {
        attributes: {
          spellcheck: "false",
          class: "prose prose-sm max-w-none dark:prose-invert focus:outline-none",
        },
      },
      onUpdate: canEdit
        ? ({ editor: instance }) => {
            const next = getMarkdownFromEditor(instance);
            setMarkdown(next);
          }
        : undefined,
      onSelectionUpdate: ({ editor: instance }) => {
        handleSelection(instance);
      },
    },
    [extensions, initialContent, canEdit, handleSelection]
  );

  useEffect(() => {
    if (!editor) return;

    if (canEdit) {
      if (initialContent === getMarkdownFromEditor(editor)) return;
      editor.commands.setContent(initialContent, { emitUpdate: false });
    } else {
      editor.commands.setContent(initialContent, { emitUpdate: false });
    }
  }, [editor, initialContent, canEdit]);

  useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange(null);
  }, [onSelectionChange, canEdit]);

  const isDirty = useMemo(
    () => (canEdit ? markdown !== initialContent : false),
    [markdown, initialContent, canEdit]
  );

  const wordCount = useMemo(() => {
    if (!markdown) return 0;
    return markdown
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }, [markdown]);

  const characterCount = markdown.length;

  const resetToLastSaved = () => {
    if (!editor || !canEdit) return;
    editor.commands.setContent(initialContent, { emitUpdate: false });
    setMarkdown(initialContent);
  };

  const lastSavedLabel = useMemo(() => {
    const date = new Date(updatedAt);
    return formatDistanceToNow(date, { addSuffix: true });
  }, [updatedAt]);

  return (
    <motion.section layout className="grid gap-6">
      <header className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs uppercase tracking-[0.3em]">
          Last saved {lastSavedLabel}
        </Badge>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{wordCount} words</span>
          <span aria-hidden>•</span>
          <span>{characterCount} characters</span>
        </div>
      </header>

      {canEdit ? (
        <form action={formAction} className="grid gap-6">
          <input type="hidden" name="documentId" value={documentId} />
          <input type="hidden" name="content" value={markdown} />
          <motion.div
            layout
            className="rounded-xl border border-border/60 bg-background/80 shadow-inner"
          >
            <EditorContent editor={editor} className="p-4" />
          </motion.div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetToLastSaved}
                disabled={isPending || !isDirty}
                className="inline-flex items-center gap-1"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
              {isDirty ? "Unsaved changes" : "All changes synced"}
            </div>
            <Button
              type="submit"
              disabled={isPending || !isDirty}
              className="inline-flex items-center gap-2"
            >
              <Save className="size-4" />
              {isPending ? "Saving..." : "Save revision"}
            </Button>
          </div>
        </form>
      ) : (
        <motion.div
          layout
          className="rounded-xl border border-border/60 bg-background/80 p-6 shadow-inner"
        >
          <EditorContent editor={editor} />
        </motion.div>
      )}
    </motion.section>
  );
};

export type { SelectionSnapshot };
