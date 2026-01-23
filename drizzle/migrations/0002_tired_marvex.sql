CREATE TABLE IF NOT EXISTS "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(20) NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp,
	"all_day" boolean DEFAULT false,
	"timezone" varchar(50) DEFAULT 'America/New_York',
	"recurrence_rule" text,
	"status" varchar(20) DEFAULT 'scheduled',
	"completed_at" timestamp,
	"notify_before_minutes" integer[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar(100)
);
