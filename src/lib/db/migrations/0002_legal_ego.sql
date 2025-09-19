CREATE TABLE "codex_user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"notifications" boolean DEFAULT true NOT NULL,
	"cookies" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "codex_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"image_url" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "codex_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "codex_user_settings" ADD CONSTRAINT "codex_user_settings_user_id_codex_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."codex_user"("id") ON DELETE cascade ON UPDATE no action;