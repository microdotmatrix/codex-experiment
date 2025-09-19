export interface CommentAuthor {
  id: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
}

export interface CommentThread {
  id: string;
  body: string;
  kind: "annotation" | "suggestion";
  status: "open" | "resolved";
  suggestionStatus: "pending" | "approved" | "rejected" | null;
  anchorStart: number | null;
  anchorEnd: number | null;
  anchorText: string | null;
  createdAt: string;
  suggestedText: string | null;
  author: CommentAuthor | null;
  replies: CommentThread[];
}

export interface InvitationInfo {
  id: string;
  email: string;
  token: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  createdAt: string;
  expiresAt: string | null;
}

export interface CollaboratorInfo {
  id: string;
  status: "pending" | "active" | "revoked";
  role: "commenter" | "viewer";
  acceptedAt: string | null;
  user?: CommentAuthor | null;
}
