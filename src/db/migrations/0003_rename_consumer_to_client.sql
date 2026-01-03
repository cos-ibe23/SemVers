-- Migration: Rename consumer fields to client in pickup_requests table
-- This makes the naming consistent (we use "client" everywhere else)

ALTER TABLE "pickup_requests" RENAME COLUMN "consumer_name" TO "client_name";--> statement-breakpoint
ALTER TABLE "pickup_requests" RENAME COLUMN "consumer_email" TO "client_email";--> statement-breakpoint
ALTER TABLE "pickup_requests" RENAME COLUMN "consumer_phone" TO "client_phone";
