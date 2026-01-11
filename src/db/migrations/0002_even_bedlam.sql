ALTER TABLE "items" DROP CONSTRAINT "items_fx_rate_id_fx_rates_id_fk";
--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "imei_source";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "service_fee_usd";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "client_paid_ngn";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "fx_rate_id";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "allocated_shipper_usd";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "status";