CREATE TABLE "spaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(500),
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true,
	"slug" varchar(255) NOT NULL,
	CONSTRAINT "spaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_spaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"space_id" integer NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"invited_by" integer,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "user_spaces_user_id_space_id_unique" UNIQUE("user_id","space_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_spaces" ADD CONSTRAINT "user_spaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_spaces" ADD CONSTRAINT "user_spaces_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_spaces" ADD CONSTRAINT "user_spaces_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "slug_idx" ON "spaces" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "user_spaces" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "space_id_idx" ON "user_spaces" USING btree ("space_id");