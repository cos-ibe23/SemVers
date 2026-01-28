ALTER TABLE "items" RENAME COLUMN "imei" TO "serial_or_imei";--> statement-breakpoint
ALTER TABLE "pickup_requests" ADD COLUMN "serial_or_imeis" text[];--> statement-breakpoint
ALTER TABLE "pickup_requests" DROP COLUMN "imeis";