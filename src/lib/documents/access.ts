import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { DocumentTable, type Document } from "@/lib/db/schema";

export type DocumentAccess = {
  document: Document;
  isOwner: boolean;
  isActiveCollaborator: boolean;
};

export const getDocumentAccess = async (
  documentId: string,
  userId: string | null
): Promise<DocumentAccess | null> => {
  const document = await db.query.DocumentTable.findFirst({
    where: eq(DocumentTable.id, documentId),
    with: {
      collaborators: true,
    },
  });

  if (!document) return null;

  if (!userId) {
    if (document.visibility === "public") {
      return {
        document,
        isOwner: false,
        isActiveCollaborator: false,
      };
    }

    return null;
  }

  const isOwner = document.ownerId === userId;
  const isActiveCollaborator = document.collaborators.some(
    (collaborator) =>
      collaborator.userId === userId && collaborator.status === "active"
  );

  if (!isOwner && !isActiveCollaborator && document.visibility !== "public") {
    return null;
  }

  return {
    document,
    isOwner,
    isActiveCollaborator,
  };
};

export const assertDocumentOwner = async (
  documentId: string,
  userId: string | null
): Promise<Document> => {
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const access = await getDocumentAccess(documentId, userId);
  if (!access || !access.isOwner) {
    throw new Error("You do not have permission to modify this document");
  }

  return access.document;
};

export const assertDocumentContributor = async (
  documentId: string,
  userId: string | null
): Promise<DocumentAccess> => {
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const access = await getDocumentAccess(documentId, userId);
  if (!access || (!access.isOwner && !access.isActiveCollaborator)) {
    throw new Error("You do not have access to this document");
  }

  return access;
};
