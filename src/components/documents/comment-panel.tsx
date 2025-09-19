"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { MessageSquarePlus, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import Image from "next/image";

import {
  createComment,
  respondToSuggestion,
  updateCommentStatus,
} from "@/lib/db/mutations/documents";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { CommentThread } from "@/components/documents/types";
import type { SelectionSnapshot } from "@/components/documents/document-editor";
import type { ActionState } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CommentPanelProps {
  documentId: string;
  viewerId: string;
  viewerIsOwner: boolean;
  canContribute: boolean;
  selection: SelectionSnapshot | null;
  comments: CommentThread[];
}

type CommentState = ActionState & {
  commentId?: string;
};

const initialCommentState: CommentState = {};

const createCommentAction = createComment as unknown as (
  state: CommentState,
  formData: FormData
) => Promise<CommentState>;

const respondToSuggestionAction = respondToSuggestion as unknown as (
  state: ActionState,
  formData: FormData
) => Promise<ActionState>;

const updateCommentStatusAction = updateCommentStatus as unknown as (
  state: ActionState,
  formData: FormData
) => Promise<ActionState>;

export const CommentPanel = ({
  documentId,
  viewerId,
  viewerIsOwner,
  canContribute,
  selection,
  comments,
}: CommentPanelProps) => {
  const [commentType, setCommentType] = useState<"annotation" | "suggestion">(
    "annotation"
  );
  const [body, setBody] = useState("");
  const [suggestion, setSuggestion] = useState("");

  const [state, formAction, isPending] = useActionState<CommentState, FormData>(
    createCommentAction,
    initialCommentState
  );

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
    if (state.success) {
      toast.success(state.success);
      setBody("");
      setSuggestion("");
    }
  }, [state]);

  const selectionHint = useMemo(() => {
    if (!selection || !selection.text) return "Select text to anchor notes.";
    if (selection.start == null || selection.end == null) {
      return "Selection detected but could not be anchored precisely. Suggestions may not be available.";
    }
    return `Anchored to markdown range ${selection.start}–${selection.end}`;
  }, [selection]);

  const selectionUnavailable =
    commentType === "suggestion" && (!selection || selection.start == null);

  return (
    <motion.section
      layout
      className="rounded-2xl border border-border/60 bg-background/90 p-6 shadow"
    >
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Collaboration feed
          </h2>
          <p className="text-xs text-muted-foreground">Anchor context, request revisions, and converge on the source of truth.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <Button
            type="button"
            size="sm"
            variant={commentType === "annotation" ? "default" : "outline"}
            onClick={() => setCommentType("annotation")}
            disabled={!canContribute}
          >
            <MessageSquarePlus className="mr-2 size-3.5" />
            Note
          </Button>
          <Button
            type="button"
            size="sm"
            variant={commentType === "suggestion" ? "default" : "outline"}
            onClick={() => setCommentType("suggestion")}
            disabled={!canContribute}
          >
            <Sparkles className="mr-2 size-3.5" />
            Suggest
          </Button>
        </div>
      </header>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="documentId" value={documentId} />
        <input type="hidden" name="kind" value={commentType} />
        {selection?.start != null && selection?.end != null && (
          <>
            <input type="hidden" name="anchorStart" value={selection.start} />
            <input type="hidden" name="anchorEnd" value={selection.end} />
          </>
        )}
        {selection?.rawText && (
          <input type="hidden" name="anchorText" value={selection.rawText} />
        )}
        <div className={cn("rounded-lg border border-dashed border-border/60 p-3 text-xs", selection ? "text-primary" : "text-muted-foreground")}>{
          selectionHint
        }</div>
        <div className="grid gap-2">
          <Label htmlFor="comment-body" className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            {commentType === "suggestion" ? "Context" : "Annotation"}
          </Label>
          <Textarea
            id="comment-body"
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={commentType === "suggestion" ? "Explain the change you propose." : "Capture feedback, questions, or highlights."}
            rows={commentType === "suggestion" ? 3 : 2}
            className="resize-none"
            required
            disabled={!canContribute}
          />
        </div>
        {commentType === "suggestion" && (
          <div className="grid gap-2">
            <Label htmlFor="comment-suggestion" className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Replacement Markdown
            </Label>
            <Textarea
              id="comment-suggestion"
              name="suggestedText"
              value={suggestion}
              onChange={(event) => setSuggestion(event.target.value)}
              placeholder={selection?.rawText ?? "Provide the updated markdown"}
              rows={3}
              className="resize-none font-mono text-sm"
              required
              disabled={selectionUnavailable || !canContribute}
            />
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {canContribute
              ? "Collaborators cannot edit directly, but they can guide the narrative here."
              : "You have read-only access to this workspace."}
          </span>
          <Button
            type="submit"
            size="sm"
            disabled={isPending || !canContribute || selectionUnavailable}
          >
            {isPending ? "Posting…" : "Submit"}
          </Button>
        </div>
      </form>

      <section className="mt-8 space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No activity yet. Invite collaborators or leave yourself structured notes.
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <CommentThreadItem
                key={comment.id}
                documentId={documentId}
                comment={comment}
                viewerId={viewerId}
                viewerIsOwner={viewerIsOwner}
              />
            ))}
          </div>
        )}
      </section>
    </motion.section>
  );
};

interface CommentThreadItemProps {
  documentId: string;
  comment: CommentThread;
  viewerId: string;
  viewerIsOwner: boolean;
}

const CommentThreadItem = ({
  documentId,
  comment,
  viewerId,
  viewerIsOwner,
}: CommentThreadItemProps) => {
  const [pending, startTransition] = useTransition();

  const isOwnComment = comment.author?.id === viewerId;
  const canResolve = viewerIsOwner || isOwnComment;

  const handleSuggestionAction = (decision: "approve" | "reject") => {
    const formData = new FormData();
    formData.append("documentId", documentId);
    formData.append("commentId", comment.id);
    formData.append("decision", decision);
    startTransition(async () => {
      const result = await respondToSuggestionAction({}, formData);
      if (result?.error) {
        toast.error(result.error);
      }
      if (result?.success) {
        toast.success(result.success);
      }
    });
  };

  const handleResolve = (status: "open" | "resolved") => {
    const formData = new FormData();
    formData.append("documentId", documentId);
    formData.append("commentId", comment.id);
    formData.append("status", status);
    startTransition(async () => {
      const result = await updateCommentStatusAction({}, formData);
      if (result?.error) {
        toast.error(result.error);
      }
      if (result?.success) {
        toast.success(result.success);
      }
    });
  };

  return (
    <div className="rounded-xl border border-border/60 bg-background/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {comment.author?.imageUrl ? (
            <Image
              src={comment.author.imageUrl}
              alt={comment.author.name ?? comment.author.email}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold uppercase text-primary">
              {(comment.author?.name ?? comment.author?.email ?? "?")
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium">
              {comment.author?.name ?? comment.author?.email ?? "Unknown"}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{comment.kind === "suggestion" ? "Suggestion" : "Annotation"}</Badge>
              <span>{new Date(comment.createdAt).toLocaleString()}</span>
              {comment.anchorText && (
                <span className="truncate max-w-[200px]">“{comment.anchorText}”</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {comment.kind === "suggestion" && comment.suggestionStatus && (
            <Badge
              variant={
                comment.suggestionStatus === "pending"
                  ? "secondary"
                  : comment.suggestionStatus === "approved"
                    ? "default"
                    : "destructive"
              }
            >
              {comment.suggestionStatus}
            </Badge>
          )}
          {comment.status === "resolved" && <Badge variant="outline">Resolved</Badge>}
        </div>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm text-foreground">{comment.body}</p>
      {comment.kind === "suggestion" && comment.suggestedText && (
        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-xs">
          {comment.suggestedText}
        </pre>
      )}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {comment.kind === "suggestion" && comment.suggestionStatus === "pending" && viewerIsOwner && (
          <>
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={() => handleSuggestionAction("approve")}
              disabled={pending}
              className="inline-flex items-center gap-2"
            >
              <ThumbsUp className="size-3.5" /> Approve
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleSuggestionAction("reject")}
              disabled={pending}
              className="inline-flex items-center gap-2"
            >
              <ThumbsDown className="size-3.5" /> Reject
            </Button>
          </>
        )}
        {canResolve && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => handleResolve(comment.status === "resolved" ? "open" : "resolved")}
            disabled={pending}
          >
            {comment.status === "resolved" ? "Reopen" : "Mark resolved"}
          </Button>
        )}
      </div>
      {comment.replies?.length ? (
        <div className="mt-4 space-y-3 border-l border-border/40 pl-4">
          {comment.replies.map((reply) => (
            <CommentThreadItem
              key={reply.id}
              documentId={documentId}
              comment={reply}
              viewerId={viewerId}
              viewerIsOwner={viewerIsOwner}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
