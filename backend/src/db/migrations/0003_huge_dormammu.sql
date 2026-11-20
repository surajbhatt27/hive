ALTER TABLE "habits" ADD COLUMN IF NOT EXISTS "schedule" jsonb;--> statement-breakpoint
UPDATE "habits" SET "schedule" = CASE
    WHEN "frequency" = 'weekly' THEN jsonb_build_object('kind', 'weekly', 'weekdays', jsonb_build_array(EXTRACT(DOW FROM "created_at")::int))
    WHEN "frequency" = 'monthly' THEN jsonb_build_object('kind', 'monthly', 'monthDays', jsonb_build_array(EXTRACT(DAY FROM "created_at")::int))
    WHEN "frequency" = 'custom' THEN jsonb_build_object('kind', 'custom', 'intervalDays', 2)
    ELSE jsonb_build_object('kind', 'daily')
END WHERE "schedule" IS NULL;--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "schedule" SET DEFAULT '{"kind":"daily"}'::jsonb;--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "schedule" SET NOT NULL;
