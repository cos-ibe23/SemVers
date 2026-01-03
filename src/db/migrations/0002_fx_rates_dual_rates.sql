-- Migration: Restructure fx_rates table for multi-currency per-shipper FX rates
-- This replaces the global fixed-currency FX rate table with a flexible per-shipper rate system

-- Create currency enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "public"."currency" AS ENUM('USD', 'NGN', 'GBP', 'EUR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Drop existing foreign key constraint from items table
ALTER TABLE "items" DROP CONSTRAINT IF EXISTS "items_fx_rate_id_fx_rates_id_fk";--> statement-breakpoint

-- Drop old fx_rates table
DROP TABLE IF EXISTS "fx_rates";--> statement-breakpoint

-- Create new fx_rates table with per-shipper multi-currency support
CREATE TABLE "fx_rates" (
    "id" serial PRIMARY KEY NOT NULL,
    "owner_user_id" text NOT NULL,
    "from_currency" "currency" NOT NULL,
    "to_currency" "currency" NOT NULL,
    "cost_rate" numeric(15, 6) NOT NULL,
    "client_rate" numeric(15, 6) NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "deleted_at" timestamp
);--> statement-breakpoint

-- Add foreign key constraint for owner_user_id
ALTER TABLE "fx_rates" ADD CONSTRAINT "fx_rates_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Recreate foreign key constraint from items table
ALTER TABLE "items" ADD CONSTRAINT "items_fx_rate_id_fx_rates_id_fk" FOREIGN KEY ("fx_rate_id") REFERENCES "public"."fx_rates"("id") ON DELETE no action ON UPDATE no action;
