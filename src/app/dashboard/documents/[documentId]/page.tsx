import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { getDocumentAccess } from "@/lib/documents/access";
import {
  getDocumentComments,
  getDocumentDetail,
} from "@/lib/db/queries/documents";
import { DocumentWorkspace } from "@/components/documents/document-workspace";
import type { CommentThread } from "@/components/documents/types";
import { env } from "@/lib/env/server";

interface DocumentWorkspacePageProps {
  params: { documentId: string };
}

export default async function DocumentWorkspacePage({
  params,
}: DocumentWorkspacePageProps) {
  const { documentId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect(`/sign-in?redirect_url=/dashboard/documents/${documentId}`);
  }

  const viewerId = userId!;

  const access = await getDocumentAccess(documentId, userId);

  if (!access) {
    notFound();
  }

  const document = await getDocumentDetail(documentId);

  if (!document) {
    notFound();
  }

  const comments = await getDocumentComments(documentId);

  const serializeComment = (comment: any): CommentThread => ({
    id: comment.id,
    body: comment.body,
    kind: comment.kind,
    status: comment.status,
    suggestionStatus: comment.suggestionStatus,
    anchorStart: comment.anchorStart,
    anchorEnd: comment.anchorEnd,
    anchorText: comment.anchorText,
    createdAt:
      comment.createdAt instanceof Date
        ? comment.createdAt.toISOString()
        : new Date(comment.createdAt).toISOString(),
    suggestedText: comment.suggestedText,
    author: comment.author
      ? {
          id: comment.author.id,
          name: comment.author.name,
          email: comment.author.email,
          imageUrl: comment.author.imageUrl,
        }
      : null,
    replies: comment.replies?.map(serializeComment) ?? [],
  });

  const serializedComments = comments.map(serializeComment);

  const payload = {
    id: document.id,
    title: document.title,
    summary: document.summary,
    content: document.content,
    updatedAt:
      document.updatedAt instanceof Date
        ? document.updatedAt.toISOString()
        : new Date(document.updatedAt).toISOString(),
    visibility: document.visibility,
    owner: {
      id: document.owner?.id ?? "",
      name: document.owner?.name ?? null,
      email: document.owner?.email ?? "",
      imageUrl: document.owner?.imageUrl ?? null,
    },
    collaborators: document.collaborators?.map((collaborator) => ({
      id: collaborator.id,
      status: collaborator.status,
      role: collaborator.role,
      acceptedAt:
        collaborator.acceptedAt instanceof Date
          ? collaborator.acceptedAt.toISOString()
          : collaborator.acceptedAt
            ? new Date(collaborator.acceptedAt).toISOString()
            : null,
      user: collaborator.user
        ? {
            id: collaborator.user.id,
            name: collaborator.user.name,
            email: collaborator.user.email,
            imageUrl: collaborator.user.imageUrl,
          }
        : null,
    })) ?? [],
    invitations: document.invitations?.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      status: invitation.status,
      createdAt:
        invitation.createdAt instanceof Date
          ? invitation.createdAt.toISOString()
          : new Date(invitation.createdAt).toISOString(),
      expiresAt:
        invitation.expiresAt instanceof Date
          ? invitation.expiresAt.toISOString()
          : invitation.expiresAt
            ? new Date(invitation.expiresAt).toISOString()
            : null,
    })) ?? [],
  };

  return (
    <DocumentWorkspace
      viewer={{ id: viewerId, isOwner: access.isOwner }}
      document={payload}
      comments={serializedComments}
      baseUrl={env.BASE_URL}
    />
  );
}
