CREATE TABLE IF NOT EXISTS "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "config" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(100) NOT NULL,
	"location" varchar(100) NOT NULL,
	"icon" varchar(10),
	"status" varchar(50) NOT NULL,
	"detail" text NOT NULL,
	"reported_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "maintenance" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"system_id" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"count" varchar(10),
	"note" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
