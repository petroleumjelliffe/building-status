/*
    Migration: Add propertyId to config table for multi-tenant isolation
    - Adds property_id column with NOT NULL constraint
    - Drops old primary key on (key)
    - Creates new composite primary key on (property_id, key)
    - Adds foreign key to properties table with CASCADE delete
    - Creates index on property_id for query performance
*/

--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "property_id" integer NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE "config" DROP CONSTRAINT "config_pkey";--> statement-breakpoint
ALTER TABLE "config" ADD CONSTRAINT "config_property_id_key_pk" PRIMARY KEY("property_id","key");--> statement-breakpoint
ALTER TABLE "config" ALTER COLUMN "property_id" DROP DEFAULT;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "config" ADD CONSTRAINT "config_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_config_property_id" ON "config" USING btree ("property_id");
