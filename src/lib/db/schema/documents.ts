import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { pgTable } from "../utils";
import { UserTable } from "./users";

export const documentVisibilityEnum = pgEnum("document_visibility", [
  "private",
  "public",
]);

export const collaboratorRoleEnum = pgEnum("document_collaborator_role", [
  "commenter",
  "viewer",
]);

export const collaboratorStatusEnum = pgEnum("document_collaborator_status", [
  "pending",
  "active",
  "revoked",
]);

export const commentKindEnum = pgEnum("document_comment_kind", [
  "annotation",
  "suggestion",
]);

export const commentStatusEnum = pgEnum("document_comment_status", [
  "open",
  "resolved",
]);

export const suggestionStatusEnum = pgEnum("document_suggestion_status", [
  "pending",
  "approved",
  "rejected",
]);

export const DocumentTable = pgTable("document", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull().default(""),
  summary: text("summary"),
  visibility: documentVisibilityEnum("visibility").notNull().default("private"),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const DocumentRelations = relations(DocumentTable, ({ one, many }) => ({
  owner: one(UserTable, {
    fields: [DocumentTable.ownerId],
    references: [UserTable.id],
  }),
  collaborators: many(DocumentCollaboratorTable),
  invitations: many(DocumentInvitationTable),
  comments: many(DocumentCommentTable),
}));

export const DocumentCollaboratorTable = pgTable(
  "document_collaborator",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => DocumentTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    role: collaboratorRoleEnum("role").notNull().default("commenter"),
    status: collaboratorStatusEnum("status").notNull().default("pending"),
    invitedById: text("invited_by_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    documentUserUnique: uniqueIndex("document_collaborator_document_user_unique").on(
      table.documentId,
      table.userId
    ),
  })
);

export const DocumentCollaboratorRelations = relations(
  DocumentCollaboratorTable,
  ({ one }) => ({
    document: one(DocumentTable, {
      fields: [DocumentCollaboratorTable.documentId],
      references: [DocumentTable.id],
    }),
    invitedBy: one(UserTable, {
      fields: [DocumentCollaboratorTable.invitedById],
      references: [UserTable.id],
    }),
    user: one(UserTable, {
      fields: [DocumentCollaboratorTable.userId],
      references: [UserTable.id],
    }),
  })
);

export const invitationStatusEnum = pgEnum("document_invitation_status", [
  "pending",
  "accepted",
  "expired",
  "revoked",
]);

export const DocumentInvitationTable = pgTable(
  "document_invitation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => DocumentTable.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    status: invitationStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at"),
    acceptedById: text("accepted_by_id").references(() => UserTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    documentEmailUnique: uniqueIndex("document_invitation_document_email_unique").on(
      table.documentId,
      table.email
    ),
  })
);

export const DocumentInvitationRelations = relations(
  DocumentInvitationTable,
  ({ one }) => ({
    document: one(DocumentTable, {
      fields: [DocumentInvitationTable.documentId],
      references: [DocumentTable.id],
    }),
    inviter: one(UserTable, {
      fields: [DocumentInvitationTable.inviterId],
      references: [UserTable.id],
    }),
    acceptedBy: one(UserTable, {
      fields: [DocumentInvitationTable.acceptedById],
      references: [UserTable.id],
    }),
  })
);

export const DocumentCommentTable = pgTable("document_comment", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => DocumentTable.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"),
  kind: commentKindEnum("kind").notNull().default("annotation"),
  status: commentStatusEnum("status").notNull().default("open"),
  suggestionStatus: suggestionStatusEnum("suggestion_status"),
  body: text("body").notNull(),
  suggestedText: text("suggested_text"),
  anchorStart: integer("anchor_start"),
  anchorEnd: integer("anchor_end"),
  anchorText: text("anchor_text"),
  anchorMeta: jsonb("anchor_meta"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const DocumentCommentRelations = relations(
  DocumentCommentTable,
  ({ one, many }) => ({
    document: one(DocumentTable, {
      fields: [DocumentCommentTable.documentId],
      references: [DocumentTable.id],
    }),
    author: one(UserTable, {
      fields: [DocumentCommentTable.authorId],
      references: [UserTable.id],
    }),
    parent: one(DocumentCommentTable, {
      fields: [DocumentCommentTable.parentId],
      references: [DocumentCommentTable.id],
      relationName: "commentParent",
    }),
    replies: many(DocumentCommentTable, {
      relationName: "commentParent",
    }),
  })
);

export type Document = typeof DocumentTable.$inferSelect;
export type DocumentCollaborator = typeof DocumentCollaboratorTable.$inferSelect;
export type DocumentInvitation = typeof DocumentInvitationTable.$inferSelect;
export type DocumentComment = typeof DocumentCommentTable.$inferSelect;
