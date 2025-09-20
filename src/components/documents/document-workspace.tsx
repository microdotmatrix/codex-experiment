"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CommentPanel } from "@/components/documents/comment-panel";
import { DocumentEditor, type SelectionSnapshot } from "@/components/documents/document-editor";
import { DocumentMetadataForm } from "@/components/documents/document-metadata-form";
import { DocumentVisibilityToggle } from "@/components/documents/document-visibility-toggle";
import { InvitationPanel } from "@/components/documents/invitation-panel";
import type {
  CollaboratorInfo,
  CommentThread,
  InvitationInfo,
} from "@/components/documents/types";
import { SharedTransition } from "@/components/layout/transitions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocumentPayload {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  updatedAt: string;
  visibility: "public" | "private";
  owner: {
    id: string;
    name: string | null;
    email: string;
    imageUrl: string | null;
  };
  collaborators: CollaboratorInfo[];
  invitations: InvitationInfo[];
}

interface ViewerContext {
  id: string;
  isOwner: boolean;
}

interface DocumentWorkspaceProps {
  viewer: ViewerContext;
  document: DocumentPayload;
  comments: CommentThread[];
  baseUrl: string;
}

export const DocumentWorkspace = ({
  viewer,
  document,
  comments,
  baseUrl,
}: DocumentWorkspaceProps) => {
  const [selection, setSelection] = useState<SelectionSnapshot | null>(null);

  const anchoredComments = useMemo(() => {
    const flatten = (threads: CommentThread[]): CommentThread[] => {
      return threads.flatMap((thread) => [thread, ...flatten(thread.replies ?? [])]);
    };

    return flatten(comments)
      .filter((comment) => comment.anchorStart != null || (comment.anchorText && comment.anchorText.trim().length > 0))
      .map((comment) => ({
        id: comment.id,
        kind: comment.kind,
        status: comment.status,
        suggestionStatus: comment.suggestionStatus,
        start: comment.anchorStart,
        end: comment.anchorEnd,
        text: comment.anchorText,
      }));
  }, [comments]);

  const activeCollaborator = useMemo(() => {
    return document.collaborators.find(
      (collaborator) =>
        collaborator.status === "active" && collaborator.user?.id === viewer.id
    );
  }, [document.collaborators, viewer.id]);

  const canContribute = viewer.isOwner || Boolean(activeCollaborator);

  return (
    <main className="mx-auto flex w-full flex-col gap-8 px-4 pb-16 pt-8 md:px-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "h-8 px-2 text-xs uppercase tracking-[0.3em] text-muted-foreground"
          )}
        >
          ← Dashboard
        </Link>
        <span aria-hidden>/</span>
        <span className="truncate text-foreground">{document.title}</span>
      </nav>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SharedTransition name={`entry-${document.id}`} share="animate-morph">
          <div className="space-y-6">
            <DocumentMetadataForm
              documentId={document.id}
              title={document.title}
              summary={document.summary}
            />
            <DocumentEditor
              documentId={document.id}
              initialContent={document.content}
              updatedAt={document.updatedAt}
              canEdit={viewer.isOwner}
              onSelectionChange={setSelection}
              anchors={anchoredComments}
            />
          </div>
        </SharedTransition>
        <aside className="space-y-6 lg:sticky lg:top-24 h-fit">
          <DocumentVisibilityToggle
            documentId={document.id}
            visibility={document.visibility}
          />
          <InvitationPanel
            documentId={document.id}
            invitations={document.invitations}
            collaborators={document.collaborators}
            isOwner={viewer.isOwner}
            baseUrl={baseUrl}
          />
          <CommentPanel
            documentId={document.id}
            viewerId={viewer.id}
            viewerIsOwner={viewer.isOwner}
            canContribute={canContribute}
            selection={selection}
            comments={comments}
          />
        </aside>
      </section>
    </main>
  );
};
