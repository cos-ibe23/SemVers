ALTER TABLE "account" ADD COLUMN "password" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "shipper_clients" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "fx_rates" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "fx_rates" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "pickups" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "pickups" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "boxes" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "boxes" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "pickup_request_items" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "pickup_request_items" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "pickup_request_items" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "pickup_requests" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "pickup_requests" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "shipper_payment_methods" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "shipper_payment_methods" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "pickup_codes" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "pickup_codes" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "imei_scans" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "imei_scans" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "pickup_templates" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "pickup_templates" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "email_logs" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "email_logs" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "deleted_at" timestamp;