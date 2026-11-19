ALTER TABLE "habit_logs" DROP CONSTRAINT IF EXISTS "habit_logs_habit_id_user_id_completed_at_unique";--> statement-breakpoint
ALTER TABLE "habit_logs" ADD COLUMN IF NOT EXISTS "log_date" date;--> statement-breakpoint
UPDATE "habit_logs" SET "log_date" = "completed_at"::date WHERE "log_date" IS NULL;--> statement-breakpoint
DELETE FROM "habit_logs" a USING "habit_logs" b WHERE a.id > b.id AND a.habit_id = b.habit_id AND a.user_id = b.user_id AND a.log_date = b.log_date;--> statement-breakpoint
ALTER TABLE "habit_logs" ALTER COLUMN "log_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "timezone" varchar(64) DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "habit_log_date_idx" ON "habit_logs" USING btree ("log_date");--> statement-breakpoint
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_log_habit_user_day_idx" UNIQUE("habit_id","user_id","log_date");
