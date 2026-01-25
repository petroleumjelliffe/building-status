CREATE TABLE IF NOT EXISTS "access_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"token" varchar(64) NOT NULL,
	"label" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	CONSTRAINT "access_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp,
	"sent_at" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"contact_method" varchar(10) NOT NULL,
	"contact_value" varchar(255) NOT NULL,
	"source" varchar(10) NOT NULL,
	"confirmation_token" varchar(64),
	"confirmed_at" timestamp,
	"approval_required" boolean DEFAULT false NOT NULL,
	"approved_by" varchar(255),
	"approved_at" timestamp,
	"revoked_at" timestamp,
	"notify_new_issues" boolean DEFAULT true NOT NULL,
	"notify_upcoming_maintenance" boolean DEFAULT true NOT NULL,
	"notify_new_announcements" boolean DEFAULT true NOT NULL,
	"notify_status_changes" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_subscriptions_confirmation_token_unique" UNIQUE("confirmation_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" varchar(64) NOT NULL,
	"hash" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "properties_property_id_unique" UNIQUE("property_id"),
	CONSTRAINT "properties_hash_unique" UNIQUE("hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resident_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"access_token_id" integer NOT NULL,
	"session_token" varchar(64) NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resident_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
-- Insert default property for existing data
INSERT INTO "properties" ("id", "property_id", "hash", "name", "created_at")
VALUES (1, 'default-property', 'default', 'Default Property', now())
ON CONFLICT DO NOTHING;
--> statement-breakpoint
-- Reset the sequence to start from 2 for future properties
SELECT setval(pg_get_serial_sequence('properties', 'id'), GREATEST(1, (SELECT MAX(id) FROM properties)));
--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "property_id" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "property_id" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "property_id" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "maintenance" ADD COLUMN "property_id" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "system_status" ADD COLUMN "property_id" integer DEFAULT 1;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "access_tokens" ADD CONSTRAINT "access_tokens_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_subscription_id_notification_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."notification_subscriptions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_subscriptions" ADD CONSTRAINT "notification_subscriptions_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resident_sessions" ADD CONSTRAINT "resident_sessions_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resident_sessions" ADD CONSTRAINT "resident_sessions_access_token_id_access_tokens_id_fk" FOREIGN KEY ("access_token_id") REFERENCES "public"."access_tokens"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_access_tokens_token" ON "access_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_access_tokens_property" ON "access_tokens" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_access_tokens_active" ON "access_tokens" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_queue_status" ON "notification_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_queue_subscription" ON "notification_queue" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notif_subs_property" ON "notification_subscriptions" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notif_subs_active" ON "notification_subscriptions" USING btree ("revoked_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notif_subs_confirmed" ON "notification_subscriptions" USING btree ("confirmed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_properties_property_id" ON "properties" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_properties_hash" ON "properties" USING btree ("hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_resident_sessions_token" ON "resident_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_resident_sessions_property" ON "resident_sessions" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_resident_sessions_expires" ON "resident_sessions" USING btree ("expires_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "announcements" ADD CONSTRAINT "announcements_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "issues" ADD CONSTRAINT "issues_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "system_status" ADD CONSTRAINT "system_status_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_announcements_property_id" ON "announcements" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_events_property_id" ON "events" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_issues_property_id" ON "issues" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_maintenance_property_id" ON "maintenance" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_system_status_property_id" ON "system_status" USING btree ("property_id");