CREATE TYPE "public"."document_collaborator_role" AS ENUM('commenter', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."document_collaborator_status" AS ENUM('pending', 'active', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."document_comment_kind" AS ENUM('annotation', 'suggestion');--> statement-breakpoint
CREATE TYPE "public"."document_comment_status" AS ENUM('open', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."document_visibility" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TYPE "public"."document_invitation_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."document_suggestion_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "codex_document_collaborator" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "document_collaborator_role" DEFAULT 'commenter' NOT NULL,
	"status" "document_collaborator_status" DEFAULT 'pending' NOT NULL,
	"invited_by_id" text NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "codex_document_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"parent_id" uuid,
	"kind" "document_comment_kind" DEFAULT 'annotation' NOT NULL,
	"status" "document_comment_status" DEFAULT 'open' NOT NULL,
	"suggestion_status" "document_suggestion_status",
	"body" text NOT NULL,
	"suggested_text" text,
	"anchor_start" integer,
	"anchor_end" integer,
	"anchor_text" text,
	"anchor_meta" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "codex_document_invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"inviter_id" text NOT NULL,
	"status" "document_invitation_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp,
	"accepted_by_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "codex_document_invitation_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "codex_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"summary" text,
	"visibility" "document_visibility" DEFAULT 'private' NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "codex_document_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "codex_document_collaborator" ADD CONSTRAINT "codex_document_collaborator_document_id_codex_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."codex_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_document_collaborator" ADD CONSTRAINT "codex_document_collaborator_user_id_codex_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."codex_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_document_collaborator" ADD CONSTRAINT "codex_document_collaborator_invited_by_id_codex_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."codex_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_document_comment" ADD CONSTRAINT "codex_document_comment_document_id_codex_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."codex_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_document_comment" ADD CONSTRAINT "codex_document_comment_author_id_codex_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."codex_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_document_invitation" ADD CONSTRAINT "codex_document_invitation_document_id_codex_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."codex_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_document_invitation" ADD CONSTRAINT "codex_document_invitation_inviter_id_codex_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."codex_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_document_invitation" ADD CONSTRAINT "codex_document_invitation_accepted_by_id_codex_user_id_fk" FOREIGN KEY ("accepted_by_id") REFERENCES "public"."codex_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_document" ADD CONSTRAINT "codex_document_owner_id_codex_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."codex_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "document_collaborator_document_user_unique" ON "codex_document_collaborator" USING btree ("document_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "document_invitation_document_email_unique" ON "codex_document_invitation" USING btree ("document_id","email");