CREATE TABLE IF NOT EXISTS "short_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(8) NOT NULL,
	"property_id" integer NOT NULL,
	"access_token_id" integer,
	"unit" varchar(50),
	"campaign" varchar(100) NOT NULL,
	"content" varchar(255),
	"label" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "short_links_code_unique" UNIQUE("code")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "short_links" ADD CONSTRAINT "short_links_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "short_links" ADD CONSTRAINT "short_links_access_token_id_access_tokens_id_fk" FOREIGN KEY ("access_token_id") REFERENCES "public"."access_tokens"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_short_links_code" ON "short_links" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_short_links_property" ON "short_links" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_short_links_access_token" ON "short_links" USING btree ("access_token_id");