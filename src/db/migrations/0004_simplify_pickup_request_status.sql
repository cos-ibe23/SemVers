-- Migration: Simplify pickup request statuses and remove payment tracking
-- Removes: estimatedQuoteUsd, paymentStatus columns
-- Simplifies status enum to: PENDING, REJECTED, CONVERTED

-- Step 1: Drop the columns we no longer need
ALTER TABLE "pickup_requests" DROP COLUMN IF EXISTS "estimated_quote_usd";--> statement-breakpoint
ALTER TABLE "pickup_requests" DROP COLUMN IF EXISTS "payment_status";--> statement-breakpoint

-- Step 2: Update any existing statuses to simplified values
-- Map old statuses to new ones:
-- QUOTED, PAYMENT_SUBMITTED, PAYMENT_VERIFIED, ACCEPTED -> PENDING (shipper hasn't converted yet)
UPDATE "pickup_requests"
SET "status" = 'PENDING'
WHERE "status" IN ('QUOTED', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'ACCEPTED');--> statement-breakpoint

-- Step 3: Recreate the enum with only the new values
-- Note: PostgreSQL doesn't allow removing values from enums directly,
-- so we need to create a new enum, update the column, then drop the old one

-- Create new enum
CREATE TYPE "pickup_request_status_new" AS ENUM ('PENDING', 'REJECTED', 'CONVERTED');--> statement-breakpoint

-- Update column to use new enum
ALTER TABLE "pickup_requests"
ALTER COLUMN "status" TYPE "pickup_request_status_new"
USING "status"::text::"pickup_request_status_new";--> statement-breakpoint

-- Drop old enum
DROP TYPE "pickup_request_status";--> statement-breakpoint

-- Rename new enum to original name
ALTER TYPE "pickup_request_status_new" RENAME TO "pickup_request_status";--> statement-breakpoint

-- Drop the payment_status enum if it exists and is no longer used
DROP TYPE IF EXISTS "payment_status";
