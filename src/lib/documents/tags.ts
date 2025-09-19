export const documentTag = (documentId: string) => `document:${documentId}`;
export const documentCommentsTag = (documentId: string) =>
  `document:${documentId}:comments`;
export const documentInvitesTag = (documentId: string) =>
  `document:${documentId}:invites`;
export const documentListTag = (userId: string) => `documents:user:${userId}`;
export const publicDocumentsTag = "documents:public";
