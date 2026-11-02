ALTER TABLE "settings" ADD COLUMN "calendar_token" text;--> statement-breakpoint
CREATE UNIQUE INDEX "settings_calendar_token_unique" ON "settings" USING btree ("calendar_token");