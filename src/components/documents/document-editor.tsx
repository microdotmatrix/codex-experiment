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
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Markdown } from "tiptap-markdown";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateDocumentContent } from "@/lib/db/mutations/documents";
import { cn, type ActionState } from "@/lib/utils";

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
  anchors?: {
    id: string;
    kind: "annotation" | "suggestion";
    status: "open" | "resolved";
    suggestionStatus: "pending" | "approved" | "rejected" | null;
    start: number | null;
    end: number | null;
    text: string | null;
  }[];
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
  anchors,
}: DocumentEditorProps) => {
  const [markdown, setMarkdown] = useState(initialContent);
  const markdownRef = useRef(initialContent);
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
    markdownRef.current = initialContent;
  }, [initialContent]);

  useEffect(() => {
    markdownRef.current = markdown;
  }, [markdown]);

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

      const snapshot = getMarkdownFromEditor(instance) || markdownRef.current;
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
    [onSelectionChange]
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

  const anchorIndicators = useMemo(() => {
    if (!anchors?.length) return [] as {
      id: string;
      kind: "annotation" | "suggestion";
      status: "open" | "resolved";
      suggestionStatus: "pending" | "approved" | "rejected" | null;
      start: number;
      text: string | null;
      ratio: number;
      stackIndex: number;
      stackSize: number;
    }[];

    const resolved = anchors
      .map((anchor) => {
        let start =
          anchor.start != null && anchor.start >= 0 ? anchor.start : null;

        if (start == null && anchor.text) {
          const rawIndex = markdown.indexOf(anchor.text);
          if (rawIndex >= 0) {
            start = rawIndex;
          } else {
            const trimmed = anchor.text.trim();
            if (trimmed) {
              const trimmedIndex = markdown.indexOf(trimmed);
              if (trimmedIndex >= 0) {
                start = trimmedIndex;
              }
            }
          }
        }

        if (start == null) return null;

        return {
          id: anchor.id,
          kind: anchor.kind,
          status: anchor.status,
          suggestionStatus: anchor.suggestionStatus,
          start,
          text: anchor.text,
        };
      })
      .filter((entry): entry is {
        id: string;
        kind: "annotation" | "suggestion";
        status: "open" | "resolved";
        suggestionStatus: "pending" | "approved" | "rejected" | null;
        start: number;
        text: string | null;
      } => entry !== null)
      .sort((a, b) => a.start - b.start);

    if (!resolved.length) return [];

    const total = Math.max(characterCount, 1);
    const grouped = new Map<number, typeof resolved>();

    for (const entry of resolved) {
      const group = grouped.get(entry.start) ?? [];
      group.push(entry);
      grouped.set(entry.start, group);
    }

    const output: {
      id: string;
      kind: "annotation" | "suggestion";
      status: "open" | "resolved";
      suggestionStatus: "pending" | "approved" | "rejected" | null;
      start: number;
      text: string | null;
      ratio: number;
      stackIndex: number;
      stackSize: number;
    }[] = [];

    Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .forEach(([start, entries]) => {
        entries.forEach((entry, index) => {
          const ratio = Math.min(Math.max(entry.start / total, 0), 1);
          output.push({
            ...entry,
            ratio,
            stackIndex: index,
            stackSize: entries.length,
          });
        });
      });

    return output;
  }, [anchors, markdown, characterCount]);

  const renderAnchorIndicators = () => {
    if (!anchorIndicators.length) return null;

    return (
      <div className="pointer-events-none absolute inset-y-4 right-2 z-10 w-8">
        <span className="sr-only" aria-live="polite">
          {anchorIndicators.length} anchored {anchorIndicators.length === 1 ? "comment" : "comments"} in this
          document.
        </span>
        {anchorIndicators.map((indicator) => {
          const colorClass =
            indicator.kind === "suggestion"
              ? indicator.suggestionStatus === "approved"
                ? "bg-emerald-500"
                : indicator.suggestionStatus === "rejected"
                  ? "bg-rose-500"
                  : "bg-amber-500"
              : indicator.status === "resolved"
                ? "bg-muted-foreground/50"
                : "bg-sky-500";

          const titleParts = [
            indicator.kind === "suggestion" ? "Suggestion" : "Annotation",
            indicator.status === "resolved" ? "(resolved)" : null,
            indicator.kind === "suggestion" && indicator.suggestionStatus
              ? `(${indicator.suggestionStatus})`
              : null,
          ].filter(Boolean);

          const snippet = indicator.text?.trim().replace(/\s+/g, " ") ?? "";

          return (
            <span
              key={`${indicator.id}-${indicator.stackIndex}`}
              className={cn(
                "pointer-events-auto absolute flex size-2 items-center justify-center rounded-full border border-background/80 shadow",
                colorClass
              )}
              style={{
                top: `calc(${(indicator.ratio * 100).toFixed(2)}%)`,
                right: `${indicator.stackIndex * 0.6}rem`,
                transform: "translateY(-50%)",
              }}
              title={`${titleParts.join(" ")}${snippet ? ` • “${snippet.slice(0, 80)}${
                snippet.length > 80 ? "…" : ""
              }”` : ""}`}
              aria-label={`${titleParts.join(" ")}${
                snippet ? ` anchored to ${snippet.slice(0, 80)}` : ""
              }`}
            />
          );
        })}
      </div>
    );
  };

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
            className="relative rounded-xl border border-border/60 bg-background/80 shadow-inner"
          >
            {renderAnchorIndicators()}
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
          className="relative rounded-xl border border-border/60 bg-background/80 p-6 shadow-inner"
        >
          {renderAnchorIndicators()}
          <EditorContent editor={editor} />
        </motion.div>
      )}
    </motion.section>
  );
};

export type { SelectionSnapshot };
