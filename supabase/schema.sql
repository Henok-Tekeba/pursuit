-- Pursuit — fresh Supabase database schema
-- Use this only for a new database. If you use `pnpm db:migrate`,
-- do not also run this file, or the migration runner will see duplicate tables.


CREATE TYPE "public"."activity_type" AS ENUM('application_created', 'email_sent', 'email_received', 'follow_up_sent', 'reply_received', 'interview_scheduled', 'assessment_received', 'status_changed', 'note_added', 'follow_up_scheduled', 'offer_received', 'rejection_received', 'withdrawn');
CREATE TYPE "public"."application_method" AS ENUM('cold_email', 'linkedin', 'referral', 'job_portal', 'other');
CREATE TYPE "public"."application_status" AS ENUM('applied', 'awaiting_response', 'replied', 'follow_up_due', 'interview', 'assessment', 'offer', 'rejected', 'ghosted', 'withdrawn');
CREATE TYPE "public"."email_direction" AS ENUM('outbound', 'inbound');
CREATE TYPE "public"."email_kind" AS ENUM('initial', 'follow_up', 'reply', 'interview', 'assessment', 'offer', 'rejection', 'other');
CREATE TYPE "public"."template_kind" AS ENUM('cold_email', 'follow_up', 'reply', 'other');
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "activity_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"email_id" uuid,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ref_no" serial NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"position" text NOT NULL,
	"location" text,
	"job_url" text,
	"contact_name" text,
	"contact_email" text,
	"contact_avatar_url" text,
	"method" "application_method" DEFAULT 'cold_email' NOT NULL,
	"status" "application_status" DEFAULT 'applied' NOT NULL,
	"applied_at" date NOT NULL,
	"last_contact_at" timestamp with time zone,
	"next_follow_up_at" date,
	"first_response_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "auth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"purpose" text DEFAULT 'login' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"website" text,
	"domain" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "email_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"direction" "email_direction" NOT NULL,
	"kind" "email_kind" NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"from_email" text,
	"to_email" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"gmail_message_id" text,
	"gmail_thread_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"follow_up_intervals" integer[] DEFAULT '{5,10,17}' NOT NULL,
	"email_signature" text,
	"default_method" "application_method" DEFAULT 'cold_email' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" "template_kind" DEFAULT 'cold_email' NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text,
	"password_hash" text,
	"target_role" text,
	"university" text,
	"graduation_year" text,
	"location" text,
	"onboarded_at" timestamp with time zone,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "activities" ADD CONSTRAINT "activities_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "activities" ADD CONSTRAINT "activities_email_id_email_interactions_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."email_interactions"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "applications" ADD CONSTRAINT "applications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "email_interactions" ADD CONSTRAINT "email_interactions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "email_interactions" ADD CONSTRAINT "email_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "templates" ADD CONSTRAINT "templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "activities_application_idx" ON "activities" USING btree ("application_id");
CREATE INDEX "activities_user_idx" ON "activities" USING btree ("user_id");
CREATE INDEX "activities_occurred_idx" ON "activities" USING btree ("occurred_at");
CREATE INDEX "applications_user_idx" ON "applications" USING btree ("user_id");
CREATE INDEX "applications_company_idx" ON "applications" USING btree ("company_id");
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");
CREATE INDEX "applications_follow_up_idx" ON "applications" USING btree ("next_follow_up_at");
CREATE UNIQUE INDEX "auth_tokens_hash_unique" ON "auth_tokens" USING btree ("token_hash");
CREATE INDEX "auth_tokens_email_idx" ON "auth_tokens" USING btree ("email");
CREATE INDEX "companies_user_idx" ON "companies" USING btree ("user_id");
CREATE INDEX "emails_application_idx" ON "email_interactions" USING btree ("application_id");
CREATE INDEX "emails_user_idx" ON "email_interactions" USING btree ("user_id");
CREATE INDEX "emails_occurred_idx" ON "email_interactions" USING btree ("occurred_at");
CREATE INDEX "templates_user_idx" ON "templates" USING btree ("user_id");
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");

ALTER TABLE "users" ADD COLUMN "password_hash" text;
