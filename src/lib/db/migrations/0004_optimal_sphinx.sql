CREATE TABLE "codex_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"birth_date" date NOT NULL,
	"death_date" date NOT NULL,
	"cause_of_death" text,
	"location" text,
	"primary_image_url" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "codex_entry_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "codex_user_upload" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"entry_id" uuid NOT NULL,
	"url" text NOT NULL,
	"key" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "codex_entry" ADD CONSTRAINT "codex_entry_owner_id_codex_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."codex_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_user_upload" ADD CONSTRAINT "codex_user_upload_user_id_codex_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."codex_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_user_upload" ADD CONSTRAINT "codex_user_upload_entry_id_codex_entry_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."codex_entry"("id") ON DELETE cascade ON UPDATE no action;