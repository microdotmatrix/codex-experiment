import {
  and,
  desc,
  eq,
  isNull,
  or,
  sql
} from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import {
  DocumentCollaboratorTable,
  DocumentCommentTable,
  DocumentInvitationTable,
  DocumentTable,
  UserTable,
  collaboratorRoleEnum,
  collaboratorStatusEnum,
  commentKindEnum,
  documentVisibilityEnum,
} from "@/lib/db/schema";
import {
  documentCommentsTag,
  documentInvitesTag,
  documentListTag,
  documentTag,
  publicDocumentsTag,
} from "@/lib/documents/tags";

const suggestionValue = commentKindEnum.enumValues.find(
  (value) => value === "suggestion"
) ?? "suggestion";

const commentCountSql = sql<number>`count(distinct ${DocumentCommentTable.id})`.as(
  "comment_count"
);

const pendingSuggestionCountSql = sql<number>`sum(case when ${DocumentCommentTable.kind} = ${suggestionValue} and ${DocumentCommentTable.suggestionStatus} = 'pending' then 1 else 0 end)`.
  as("pending_suggestions");

type Visibility = (typeof documentVisibilityEnum.enumValues)[number];
type CollaboratorStatus = (typeof collaboratorStatusEnum.enumValues)[number];
type CollaboratorRole = (typeof collaboratorRoleEnum.enumValues)[number];

type OwnerSummary = {
  id: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
};

type CollaboratorSummary = {
  id: string;
  status: CollaboratorStatus;
  role: CollaboratorRole;
} | null;

export type DocumentSummary = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  visibility: Visibility;
  updatedAt: string;
  owner: OwnerSummary;
  collaborator: CollaboratorSummary;
  commentCount: number;
  pendingSuggestions: number;
};

const mapSummaryRow = (row: {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  visibility: Visibility;
  updatedAt: Date | string;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string;
  ownerImage: string | null;
  collaboratorId: string | null;
  collaboratorStatus: CollaboratorStatus | null;
  collaboratorRole: CollaboratorRole | null;
  commentCount: number | null;
  pendingSuggestions: number | null;
}): DocumentSummary => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  summary: row.summary,
  visibility: row.visibility,
  updatedAt:
    row.updatedAt instanceof Date
      ? row.updatedAt.toISOString()
      : new Date(row.updatedAt).toISOString(),
  owner: {
    id: row.ownerId,
    name: row.ownerName,
    email: row.ownerEmail,
    imageUrl: row.ownerImage,
  },
  collaborator: row.collaboratorId
    ? {
        id: row.collaboratorId,
        status: row.collaboratorStatus ?? "active",
        role: row.collaboratorRole ?? "commenter",
      }
    : null,
  commentCount: row.commentCount ?? 0,
  pendingSuggestions: row.pendingSuggestions ?? 0,
});

export const getDocumentsForUser = async (
  userId: string
): Promise<DocumentSummary[]> => {
  return unstable_cache(
    async () => {
      const results = await db
        .select({
          id: DocumentTable.id,
          title: DocumentTable.title,
          slug: DocumentTable.slug,
          summary: DocumentTable.summary,
          visibility: DocumentTable.visibility,
          updatedAt: DocumentTable.updatedAt,
          ownerId: DocumentTable.ownerId,
          ownerName: UserTable.name,
          ownerEmail: UserTable.email,
          ownerImage: UserTable.imageUrl,
          collaboratorId: DocumentCollaboratorTable.id,
          collaboratorStatus: DocumentCollaboratorTable.status,
          collaboratorRole: DocumentCollaboratorTable.role,
          commentCount: commentCountSql,
          pendingSuggestions: pendingSuggestionCountSql,
        })
        .from(DocumentTable)
        .leftJoin(
          DocumentCollaboratorTable,
          and(
            eq(DocumentCollaboratorTable.documentId, DocumentTable.id),
            eq(DocumentCollaboratorTable.userId, userId)
          )
        )
        .innerJoin(UserTable, eq(UserTable.id, DocumentTable.ownerId))
        .leftJoin(
          DocumentCommentTable,
          eq(DocumentCommentTable.documentId, DocumentTable.id)
        )
        .where(
          or(
            eq(DocumentTable.ownerId, userId),
            eq(DocumentCollaboratorTable.userId, userId)
          )
        )
        .groupBy(
          DocumentTable.id,
          DocumentCollaboratorTable.id,
          UserTable.id
        )
        .orderBy(desc(DocumentTable.updatedAt));

      return results.map(mapSummaryRow);
    },
    ["documents-for-user", userId],
    { revalidate: 60, tags: [documentListTag(userId)] }
  )();
};

export const getPublicDocuments = async (): Promise<DocumentSummary[]> => {
  return unstable_cache(
    async () => {
      const results = await db
        .select({
          id: DocumentTable.id,
          title: DocumentTable.title,
          slug: DocumentTable.slug,
          summary: DocumentTable.summary,
          visibility: DocumentTable.visibility,
          updatedAt: DocumentTable.updatedAt,
          ownerId: DocumentTable.ownerId,
          ownerName: UserTable.name,
          ownerEmail: UserTable.email,
          ownerImage: UserTable.imageUrl,
          commentCount: commentCountSql,
          pendingSuggestions: pendingSuggestionCountSql,
        })
        .from(DocumentTable)
        .innerJoin(UserTable, eq(UserTable.id, DocumentTable.ownerId))
        .leftJoin(
          DocumentCommentTable,
          eq(DocumentCommentTable.documentId, DocumentTable.id)
        )
        .where(eq(DocumentTable.visibility, "public"))
        .groupBy(DocumentTable.id, UserTable.id)
        .orderBy(desc(DocumentTable.updatedAt));

      return results.map((row) =>
        mapSummaryRow({
          ...row,
          collaboratorId: null,
          collaboratorStatus: null,
          collaboratorRole: null,
        })
      );
    },
    ["documents-public"],
    { revalidate: 60, tags: [publicDocumentsTag] }
  )();
};

export const getDocumentDetail = async (documentId: string) => {
  return unstable_cache(
    async () => {
      return db.query.DocumentTable.findFirst({
        where: eq(DocumentTable.id, documentId),
        with: {
          owner: true,
          collaborators: {
            where: (collaborator, { ne }) => ne(collaborator.status, "revoked"),
            orderBy: (collaborator, { asc }) => [asc(collaborator.createdAt)],
            with: {
              user: true,
            },
          },
          invitations: {
            where: (invitation, { ne }) => ne(invitation.status, "revoked"),
            orderBy: (invitation, { desc }) => [desc(invitation.createdAt)],
          },
        },
      });
    },
    ["document-detail", documentId],
    {
      revalidate: 60,
      tags: [documentTag(documentId), documentInvitesTag(documentId)],
    }
  )();
};

export const getDocumentComments = async (documentId: string) => {
  return unstable_cache(
    async () => {
      return db.query.DocumentCommentTable.findMany({
        where: and(
          eq(DocumentCommentTable.documentId, documentId),
          isNull(DocumentCommentTable.parentId)
        ),
        orderBy: (fields, operators) => [operators.asc(fields.createdAt)],
        with: {
          author: true,
          replies: {
            orderBy: (fields, operators) => [operators.asc(fields.createdAt)],
            with: {
              author: true,
            },
          },
        },
      });
    },
    ["document-comments", documentId],
    { revalidate: 60, tags: [documentCommentsTag(documentId)] }
  )();
};

export const getDocumentInvitations = async (documentId: string) => {
  return unstable_cache(
    async () => {
      return db.query.DocumentInvitationTable.findMany({
        where: eq(DocumentInvitationTable.documentId, documentId),
        orderBy: (invitation, { desc }) => [desc(invitation.createdAt)],
      });
    },
    ["document-invitations", documentId],
    { revalidate: 60, tags: [documentInvitesTag(documentId)] }
  )();
};

export const getDocumentBySlug = async (slug: string) => {
  return db.query.DocumentTable.findFirst({
    where: eq(DocumentTable.slug, slug),
    with: {
      owner: true,
    },
  });
};

export const getInvitationByToken = async (token: string) => {
  return db.query.DocumentInvitationTable.findFirst({
    where: eq(DocumentInvitationTable.token, token),
    with: {
      document: {
        columns: {
          id: true,
          title: true,
          slug: true,
        },
        with: {
          owner: {
            columns: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });
};
