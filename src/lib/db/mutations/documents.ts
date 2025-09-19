"use server";

import { randomUUID } from "crypto";
import { revalidateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { action, type ActionState } from "@/lib/utils";
import { db } from "@/lib/db";
import {
  documentCommentsTag,
  documentInvitesTag,
  documentListTag,
  documentTag,
  publicDocumentsTag,
} from "@/lib/documents/tags";
import {
  assertDocumentContributor,
  assertDocumentOwner,
  type DocumentAccess,
} from "@/lib/documents/access";
import { upsertUser } from "@/lib/db/mutations/auth";
import {
  DocumentCommentTable,
  DocumentCollaboratorTable,
  DocumentInvitationTable,
  DocumentTable,
  UserTable,
  commentKindEnum,
  commentStatusEnum,
  documentVisibilityEnum,
  invitationStatusEnum,
} from "@/lib/db/schema";
import type { Document } from "@/lib/db/schema";

const visibilityValues = documentVisibilityEnum.enumValues;
const commentKinds = commentKindEnum.enumValues;

const createDocumentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  summary: z.string().max(240).optional().or(z.literal("")),
  visibility: z.enum(visibilityValues).default("private"),
  content: z.string().optional().or(z.literal("")),
});

const updateDocumentContentSchema = z.object({
  documentId: z.string().uuid(),
  content: z.string(),
  summary: z.string().max(240).optional().or(z.literal("")),
});

const updateDocumentMetadataSchema = z.object({
  documentId: z.string().uuid(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  summary: z.string().max(240).optional().or(z.literal("")),
});

const toggleVisibilitySchema = z.object({
  documentId: z.string().uuid(),
  visibility: z.enum(visibilityValues),
});

const collaboratorInviteSchema = z.object({
  documentId: z.string().uuid(),
  email: z.string().email(),
});

const acceptInvitationSchema = z.object({
  token: z.string().min(1),
});

const commentInputSchema = z.object({
  documentId: z.string().uuid(),
  body: z.string().min(1, "Comment cannot be empty"),
  kind: z.enum(commentKinds).default("annotation"),
  parentId: z.string().uuid().optional(),
  anchorStart: z
    .union([z.coerce.number().int().nonnegative(), z.null()])
    .optional(),
  anchorEnd: z
    .union([z.coerce.number().int().nonnegative(), z.null()])
    .optional(),
  anchorText: z.string().optional(),
  anchorMeta: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      try {
        return JSON.parse(value);
      } catch (error) {
        console.error("Failed to parse anchor meta", error);
        return undefined;
      }
    }),
  suggestedText: z.string().optional(),
});

const commentStatusSchema = z.object({
  documentId: z.string().uuid(),
  commentId: z.string().uuid(),
  status: z.enum(commentStatusEnum.enumValues),
});

const suggestionDecisionSchema = z.object({
  documentId: z.string().uuid(),
  commentId: z.string().uuid(),
  decision: z.enum(["approve", "reject"] as const),
});

const removeCollaboratorSchema = z.object({
  documentId: z.string().uuid(),
  collaboratorId: z.string().uuid(),
});

const revokeInvitationSchema = z.object({
  documentId: z.string().uuid(),
  invitationId: z.string().uuid(),
});

const slugify = (value: string) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const ensureUniqueSlug = async (title: string) => {
  const base = slugify(title) || "untitled";
  let slug = base;
  let attempt = 1;

  while (true) {
    const existing = await db.query.DocumentTable.findFirst({
      where: eq(DocumentTable.slug, slug),
      columns: { id: true },
    });

    if (!existing) return slug;

    attempt += 1;
    slug = `${base}-${attempt}`;
  }
};

const success = (message: string, data: Record<string, unknown> = {}) => ({
  success: message,
  ...data,
});

const failure = (message: string): ActionState => ({
  error: message,
});

const revalidateCollaborators = async (documentId: string) => {
  const collaborators = await db
    .select({ userId: DocumentCollaboratorTable.userId })
    .from(DocumentCollaboratorTable)
    .where(
      and(
        eq(DocumentCollaboratorTable.documentId, documentId),
        eq(DocumentCollaboratorTable.status, "active")
      )
    );

  for (const collaborator of collaborators) {
    if (collaborator.userId) {
      revalidateTag(documentListTag(collaborator.userId));
    }
  }
};

export const createDocument = action(
  createDocumentSchema,
  async ({ title, summary, visibility, content }) => {
    const { userId } = await auth();
    if (!userId) {
      return failure("You must be signed in to create a document");
    }

    const slug = await ensureUniqueSlug(title);

    const insertedDocuments = await db
      .insert(DocumentTable)
      .values({
        title,
        slug,
        summary: summary || null,
        visibility,
        ownerId: userId,
        content: content ?? "",
      })
      .returning();

    const inserted = insertedDocuments[0];

    if (!inserted) {
      return failure("Unable to create document");
    }

    revalidateTag(documentListTag(userId));
    revalidateTag(documentTag(inserted.id));
    if (visibility === "public") {
      revalidateTag(publicDocumentsTag);
    }

    return success("Document created", { documentId: inserted.id, slug });
  }
);

export const updateDocumentContent = action(
  updateDocumentContentSchema,
  async ({ documentId, content, summary }) => {
    const { userId } = await auth();
    try {
      await assertDocumentOwner(documentId, userId ?? null);
    } catch (error) {
      return failure(error instanceof Error ? error.message : "Unauthorized");
    }

    const updatePayload: {
      content: string;
      summary?: string | null;
      updatedAt: Date;
    } = {
      content,
      updatedAt: new Date(),
    };

    if (summary !== undefined) {
      updatePayload.summary = summary || null;
    }

    const [updated] = await db
      .update(DocumentTable)
      .set(updatePayload)
      .where(eq(DocumentTable.id, documentId))
      .returning({
        ownerId: DocumentTable.ownerId,
        visibility: DocumentTable.visibility,
      });

    if (!updated) {
      return failure("Document not found");
    }

    revalidateTag(documentTag(documentId));
    revalidateTag(documentCommentsTag(documentId));
    revalidateTag(documentListTag(updated.ownerId));
    await revalidateCollaborators(documentId);
    if (updated.visibility === "public") {
      revalidateTag(publicDocumentsTag);
    }

    return success("Document updated");
  }
);

export const toggleDocumentVisibility = action(
  toggleVisibilitySchema,
  async ({ documentId, visibility }) => {
    const { userId } = await auth();
    try {
      await assertDocumentOwner(documentId, userId ?? null);
    } catch (error) {
      return failure(error instanceof Error ? error.message : "Unauthorized");
    }

    const [updated] = await db
      .update(DocumentTable)
      .set({
        visibility,
        updatedAt: new Date(),
      })
      .where(eq(DocumentTable.id, documentId))
      .returning({
        ownerId: DocumentTable.ownerId,
        visibility: DocumentTable.visibility,
      });

    if (!updated) {
      return failure("Document not found");
    }

    revalidateTag(documentTag(documentId));
    revalidateTag(documentListTag(updated.ownerId));
    await revalidateCollaborators(documentId);
    revalidateTag(publicDocumentsTag);

    return success("Visibility updated");
  }
);

export const updateDocumentMetadata = action(
  updateDocumentMetadataSchema,
  async ({ documentId, title, summary }) => {
    const { userId } = await auth();
    try {
      await assertDocumentOwner(documentId, userId ?? null);
    } catch (error) {
      return failure(error instanceof Error ? error.message : "Unauthorized");
    }

    const [updated] = await db
      .update(DocumentTable)
      .set({
        title,
        summary: summary || null,
        updatedAt: new Date(),
      })
      .where(eq(DocumentTable.id, documentId))
      .returning({
        ownerId: DocumentTable.ownerId,
        visibility: DocumentTable.visibility,
      });

    if (!updated) {
      return failure("Document not found");
    }

    revalidateTag(documentTag(documentId));
    revalidateTag(documentListTag(updated.ownerId));
    await revalidateCollaborators(documentId);
    if (updated.visibility === "public") {
      revalidateTag(publicDocumentsTag);
    }

    return success("Document details updated");
  }
);

export const inviteCollaborator = action(
  collaboratorInviteSchema,
  async ({ documentId, email }) => {
    const { userId } = await auth();
    let document: Document;
    try {
      document = await assertDocumentOwner(documentId, userId ?? null);
    } catch (error) {
      return failure(error instanceof Error ? error.message : "Unauthorized");
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    const [invitation] = await db
      .insert(DocumentInvitationTable)
      .values({
        documentId,
        email: email.toLowerCase(),
        token,
        inviterId: document.ownerId,
        status: "pending",
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [DocumentInvitationTable.documentId, DocumentInvitationTable.email],
        set: {
          token,
          status: "pending",
          expiresAt,
          updatedAt: new Date(),
        },
      })
      .returning();

    const existingUser = await db.query.UserTable.findFirst({
      where: eq(UserTable.email, email.toLowerCase()),
      columns: { id: true },
    });

    if (existingUser) {
      await db
        .insert(DocumentCollaboratorTable)
        .values({
          documentId,
          userId: existingUser.id,
          invitedById: document.ownerId,
          status: "active",
          role: "commenter",
          acceptedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [DocumentCollaboratorTable.documentId, DocumentCollaboratorTable.userId],
          set: {
            status: "active",
            updatedAt: new Date(),
            acceptedAt: new Date(),
          },
        });

      revalidateTag(documentTag(documentId));
      revalidateTag(documentListTag(existingUser.id));
    }

    revalidateTag(documentInvitesTag(documentId));

    return success("Invitation sent", {
      invitationId: invitation.id,
      token,
    });
  }
);

export const acceptInvitation = action(
  acceptInvitationSchema,
  async ({ token }) => {
    const { userId } = await auth();
    if (!userId) {
      return failure("You must be signed in to accept an invitation");
    }

    await upsertUser(userId);

    const invitation = await db.query.DocumentInvitationTable.findFirst({
      where: eq(DocumentInvitationTable.token, token),
    });

    if (!invitation) {
      return failure("Invitation not found");
    }

    if (invitation.status !== "pending") {
      return failure("This invitation is no longer active");
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      await db
        .update(DocumentInvitationTable)
        .set({
          status: "expired",
          updatedAt: new Date(),
        })
        .where(eq(DocumentInvitationTable.id, invitation.id));
      return failure("This invitation has expired");
    }

    await db
      .update(DocumentInvitationTable)
      .set({
        status: "accepted",
        acceptedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(DocumentInvitationTable.id, invitation.id))

    await db
      .insert(DocumentCollaboratorTable)
      .values({
        documentId: invitation.documentId,
        userId,
        invitedById: invitation.inviterId,
        status: "active",
        role: "commenter",
        acceptedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [DocumentCollaboratorTable.documentId, DocumentCollaboratorTable.userId],
        set: {
          status: "active",
          updatedAt: new Date(),
          acceptedAt: new Date(),
        },
      });

    revalidateTag(documentTag(invitation.documentId));
    revalidateTag(documentInvitesTag(invitation.documentId));
    revalidateTag(documentListTag(invitation.inviterId));
    revalidateTag(documentListTag(userId));
    await revalidateCollaborators(invitation.documentId);

    return success("Invitation accepted", {
      documentId: invitation.documentId,
    });
  }
);

export const createComment = action(
  commentInputSchema,
  async ({
    documentId,
    body,
    kind,
    parentId,
    anchorStart,
    anchorEnd,
    anchorText,
    anchorMeta,
    suggestedText,
  }) => {
    const { userId } = await auth();
    let access: DocumentAccess;
    try {
      access = await assertDocumentContributor(documentId, userId ?? null);
    } catch (error) {
      return failure(error instanceof Error ? error.message : "Unauthorized");
    }

    if (kind === "suggestion" && !suggestedText) {
      return failure("Suggestions must include replacement text");
    }

    if (kind === "suggestion" && (anchorStart == null || anchorEnd == null)) {
      return failure("Suggestions require a selection anchor");
    }

    const insertedComments = await db
      .insert(DocumentCommentTable)
      .values({
        documentId,
        authorId: userId!,
        parentId: parentId ?? null,
        kind,
        status: "open",
        suggestionStatus: kind === "suggestion" ? "pending" : null,
        body,
        suggestedText: kind === "suggestion" ? suggestedText ?? null : null,
        anchorStart: anchorStart ?? null,
        anchorEnd: anchorEnd ?? null,
        anchorText: anchorText ?? null,
        anchorMeta: anchorMeta ?? null,
      })
      .returning();

    const comment = insertedComments[0];

    if (!comment) {
      return failure("Unable to create comment");
    }

    revalidateTag(documentCommentsTag(documentId));
    revalidateTag(documentTag(documentId));
    revalidateTag(documentListTag(access.document.ownerId));
    await revalidateCollaborators(documentId);
    if (access.document.visibility === "public") {
      revalidateTag(publicDocumentsTag);
    }

    return success("Comment added", { commentId: comment.id });
  }
);

export const updateCommentStatus = action(
  commentStatusSchema,
  async ({ documentId, commentId, status }) => {
    const { userId } = await auth();
    let access: DocumentAccess;
    try {
      access = await assertDocumentContributor(documentId, userId ?? null);
    } catch (error) {
      return failure(error instanceof Error ? error.message : "Unauthorized");
    }

    await db
      .update(DocumentCommentTable)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(DocumentCommentTable.id, commentId));

    revalidateTag(documentCommentsTag(documentId));
    revalidateTag(documentTag(documentId));
    await revalidateCollaborators(documentId);
    if (access.document.visibility === "public") {
      revalidateTag(publicDocumentsTag);
    }

    return success("Comment updated");
  }
);

export const respondToSuggestion = action(
  suggestionDecisionSchema,
  async ({ documentId, commentId, decision }) => {
    const { userId } = await auth();
    let document: Document;
    try {
      document = await assertDocumentOwner(documentId, userId ?? null);
    } catch (error) {
      return failure(error instanceof Error ? error.message : "Unauthorized");
    }

    const comment = await db.query.DocumentCommentTable.findFirst({
      where: and(
        eq(DocumentCommentTable.id, commentId),
        eq(DocumentCommentTable.documentId, documentId),
      ),
    });

    if (!comment) {
      return failure("Suggestion not found");
    }

    if (comment.kind !== "suggestion") {
      return failure("Only suggestions can be approved or rejected");
    }

    if (comment.suggestionStatus !== "pending") {
      return failure("This suggestion has already been processed");
    }

    if (decision === "reject") {
      await db
        .update(DocumentCommentTable)
        .set({
          suggestionStatus: "rejected",
          status: "resolved",
          updatedAt: new Date(),
        })
        .where(eq(DocumentCommentTable.id, commentId));

      revalidateTag(documentCommentsTag(documentId));
      revalidateTag(documentTag(documentId));
      await revalidateCollaborators(documentId);
      return success("Suggestion rejected");
    }

    if (comment.anchorStart == null || comment.anchorEnd == null) {
      return failure("Cannot apply suggestion without a selection anchor");
    }

    const existingContent = document.content ?? "";
    if (comment.anchorEnd > existingContent.length) {
      return failure("Suggestion selection is out of bounds");
    }

    const newContent =
      existingContent.slice(0, comment.anchorStart) +
      (comment.suggestedText ?? "") +
      existingContent.slice(comment.anchorEnd);

    await db
      .update(DocumentTable)
      .set({ content: newContent, updatedAt: new Date() })
      .where(eq(DocumentTable.id, documentId));

    await db
      .update(DocumentCommentTable)
      .set({
        suggestionStatus: "approved",
        status: "resolved",
        updatedAt: new Date(),
      })
      .where(eq(DocumentCommentTable.id, commentId));

    revalidateTag(documentCommentsTag(documentId));
    revalidateTag(documentTag(documentId));
    revalidateTag(documentListTag(document.ownerId));
    await revalidateCollaborators(documentId);
    if (document.visibility === "public") {
      revalidateTag(publicDocumentsTag);
    }

    return success("Suggestion approved");
  }
);

export const removeCollaborator = action(
  removeCollaboratorSchema,
  async ({ documentId, collaboratorId }) => {
    const { userId } = await auth();
    try {
      await assertDocumentOwner(documentId, userId ?? null);
    } catch (error) {
      return failure(error instanceof Error ? error.message : "Unauthorized");
    }

    const collaborator = await db.query.DocumentCollaboratorTable.findFirst({
      where: and(
        eq(DocumentCollaboratorTable.id, collaboratorId),
        eq(DocumentCollaboratorTable.documentId, documentId)
      ),
      columns: { userId: true },
    });

    if (!collaborator) {
      return failure("Collaborator not found");
    }

    await db
      .delete(DocumentCollaboratorTable)
      .where(
        and(
          eq(DocumentCollaboratorTable.documentId, documentId),
          eq(DocumentCollaboratorTable.id, collaboratorId)
        )
      );

    revalidateTag(documentTag(documentId));
    revalidateTag(documentInvitesTag(documentId));
    if (collaborator.userId) {
      revalidateTag(documentListTag(collaborator.userId));
    }
    await revalidateCollaborators(documentId);

    return success("Collaborator removed");
  }
);

export const revokeInvitation = action(
  revokeInvitationSchema,
  async ({ documentId, invitationId }) => {
    const { userId } = await auth();
    try {
      await assertDocumentOwner(documentId, userId ?? null);
    } catch (error) {
      return failure(error instanceof Error ? error.message : "Unauthorized");
    }

    await db
      .update(DocumentInvitationTable)
      .set({
        status: "revoked",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(DocumentInvitationTable.id, invitationId),
          eq(DocumentInvitationTable.documentId, documentId)
        )
      );

    revalidateTag(documentInvitesTag(documentId));
    revalidateTag(documentTag(documentId));

    return success("Invitation revoked");
  }
);
