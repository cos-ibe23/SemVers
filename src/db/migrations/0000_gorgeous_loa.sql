CREATE TYPE "public"."pickup_status" AS ENUM('DRAFT', 'CONFIRMED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('PENDING', 'IN_BOX', 'IN_TRANSIT', 'DELIVERED', 'HANDED_OFF', 'SOLD', 'RETURNED');--> statement-breakpoint
CREATE TYPE "public"."box_status" AS ENUM('OPEN', 'SEALED', 'SHIPPED', 'DELIVERED');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('PENDING', 'IN_TRANSIT', 'DELIVERED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('UNPAID', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."pickup_request_status" AS ENUM('PENDING', 'QUOTED', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'ACCEPTED', 'REJECTED', 'CONVERTED');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('ZELLE', 'CASHAPP', 'VENMO', 'BANK_TRANSFER', 'PAYPAL', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."payment_proof_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."invoice_type" AS ENUM('QUOTE', 'FINAL');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('NEW_REQUEST', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'BOX_SHIPPED', 'BOX_DELIVERED');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"id_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'CLIENT' NOT NULL,
	"is_system_user" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"business_name" varchar(255),
	"logo_url" varchar(512),
	"street" varchar(255),
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100),
	"phone_country_code" varchar(10),
	"phone_number" varchar(20),
	"request_slug" varchar(100),
	"onboarded_at" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_request_slug_unique" UNIQUE("request_slug")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipper_clients" (
	"shipper_id" text NOT NULL,
	"client_id" text NOT NULL,
	"nickname" varchar(255),
	"phone" varchar(50),
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shipper_clients_shipper_id_client_id_pk" PRIMARY KEY("shipper_id","client_id")
);
--> statement-breakpoint
CREATE TABLE "fx_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"buy_rate_usd_ngn" numeric(12, 4) NOT NULL,
	"client_rate_usd_ngn" numeric(12, 4) NOT NULL,
	"atm_fee_per_990_usd" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pickups" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"client_user_id" text NOT NULL,
	"pickup_fee_usd" numeric(10, 2) DEFAULT '0',
	"item_price_usd" numeric(10, 2) DEFAULT '0',
	"notes" text,
	"pickup_date" date,
	"status" "pickup_status" DEFAULT 'DRAFT',
	"source_request_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"pickup_id" integer NOT NULL,
	"box_id" integer,
	"category" varchar(100) NOT NULL,
	"model" varchar(255),
	"imei" varchar(50),
	"imei_source" varchar(50),
	"estimated_weight_lb" numeric(8, 2) DEFAULT '0',
	"client_shipping_usd" numeric(10, 2) DEFAULT '0',
	"service_fee_usd" numeric(10, 2) DEFAULT '0',
	"client_paid_ngn" numeric(15, 2),
	"fx_rate_id" integer,
	"allocated_shipper_usd" numeric(10, 2),
	"status" "item_status" DEFAULT 'PENDING',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boxes" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"label" varchar(100),
	"estimated_weight_lb" numeric(8, 2),
	"actual_weight_lb" numeric(8, 2),
	"shipper_rate_per_lb" numeric(10, 2),
	"insurance_usd" numeric(10, 2) DEFAULT '0',
	"status" "box_status" DEFAULT 'OPEN',
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "box_shipments" (
	"box_id" integer NOT NULL,
	"shipment_id" integer NOT NULL,
	CONSTRAINT "box_shipments_box_id_shipment_id_pk" PRIMARY KEY("box_id","shipment_id")
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"carrier" varchar(100),
	"tracking_number" varchar(100),
	"ship_date" date,
	"estimated_arrival" date,
	"actual_arrival" date,
	"status" "shipment_status" DEFAULT 'PENDING',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pickup_request_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"category" varchar(100),
	"description" text,
	"marketplace_url" varchar(512),
	"budget_usd" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "pickup_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"shipper_user_id" text NOT NULL,
	"consumer_name" varchar(255) NOT NULL,
	"consumer_email" varchar(255),
	"consumer_phone" varchar(50),
	"status" "pickup_request_status" DEFAULT 'PENDING',
	"estimated_quote_usd" numeric(10, 2),
	"payment_status" "payment_status" DEFAULT 'UNPAID',
	"converted_pickup_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_proofs" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"transaction_reference" varchar(255),
	"screenshot_url" varchar(512),
	"amount_paid" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD',
	"notes" text,
	"status" "payment_proof_status" DEFAULT 'PENDING',
	"verified_by_user_id" text,
	"verified_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipper_payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "payment_method" NOT NULL,
	"handle" varchar(255) NOT NULL,
	"instructions" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pickup_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"box_id" integer NOT NULL,
	"client_user_id" text NOT NULL,
	"code" varchar(20) NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imei_scans" (
	"id" serial PRIMARY KEY NOT NULL,
	"imei" varchar(50) NOT NULL,
	"provider" varchar(50),
	"result" jsonb,
	"cost_usd" numeric(8, 4),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"client_user_id" text,
	"pickup_id" integer,
	"box_id" integer,
	"type" "invoice_type" NOT NULL,
	"total_usd" numeric(12, 2),
	"total_ngn" numeric(15, 2),
	"pdf_url" varchar(512),
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pickup_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100),
	"default_pickup_fee_usd" numeric(10, 2),
	"default_client_shipping_usd" numeric(10, 2),
	"default_service_fee_usd" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"to_email" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"template_name" varchar(100),
	"related_user_id" text,
	"related_request_id" integer,
	"related_box_id" integer,
	"status" varchar(20) DEFAULT 'PENDING',
	"error_message" text,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email_on_new_request" boolean DEFAULT true,
	"email_on_payment_submitted" boolean DEFAULT true,
	"email_on_payment_verified" boolean DEFAULT true,
	"email_on_box_shipped" boolean DEFAULT true,
	"email_on_box_delivered" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"related_request_id" integer,
	"related_box_id" integer,
	"related_shipment_id" integer,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipper_clients" ADD CONSTRAINT "shipper_clients_shipper_id_user_id_fk" FOREIGN KEY ("shipper_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipper_clients" ADD CONSTRAINT "shipper_clients_client_id_user_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickups" ADD CONSTRAINT "pickups_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickups" ADD CONSTRAINT "pickups_client_user_id_user_id_fk" FOREIGN KEY ("client_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_pickup_id_pickups_id_fk" FOREIGN KEY ("pickup_id") REFERENCES "public"."pickups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_box_id_boxes_id_fk" FOREIGN KEY ("box_id") REFERENCES "public"."boxes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_fx_rate_id_fx_rates_id_fk" FOREIGN KEY ("fx_rate_id") REFERENCES "public"."fx_rates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boxes" ADD CONSTRAINT "boxes_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "box_shipments" ADD CONSTRAINT "box_shipments_box_id_boxes_id_fk" FOREIGN KEY ("box_id") REFERENCES "public"."boxes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "box_shipments" ADD CONSTRAINT "box_shipments_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_request_items" ADD CONSTRAINT "pickup_request_items_request_id_pickup_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."pickup_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_requests" ADD CONSTRAINT "pickup_requests_shipper_user_id_user_id_fk" FOREIGN KEY ("shipper_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_requests" ADD CONSTRAINT "pickup_requests_converted_pickup_id_pickups_id_fk" FOREIGN KEY ("converted_pickup_id") REFERENCES "public"."pickups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_request_id_pickup_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."pickup_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_verified_by_user_id_user_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipper_payment_methods" ADD CONSTRAINT "shipper_payment_methods_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_codes" ADD CONSTRAINT "pickup_codes_box_id_boxes_id_fk" FOREIGN KEY ("box_id") REFERENCES "public"."boxes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_codes" ADD CONSTRAINT "pickup_codes_client_user_id_user_id_fk" FOREIGN KEY ("client_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_user_id_user_id_fk" FOREIGN KEY ("client_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_pickup_id_pickups_id_fk" FOREIGN KEY ("pickup_id") REFERENCES "public"."pickups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_box_id_boxes_id_fk" FOREIGN KEY ("box_id") REFERENCES "public"."boxes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_templates" ADD CONSTRAINT "pickup_templates_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_related_user_id_user_id_fk" FOREIGN KEY ("related_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_related_request_id_pickup_requests_id_fk" FOREIGN KEY ("related_request_id") REFERENCES "public"."pickup_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_related_box_id_boxes_id_fk" FOREIGN KEY ("related_box_id") REFERENCES "public"."boxes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_request_id_pickup_requests_id_fk" FOREIGN KEY ("related_request_id") REFERENCES "public"."pickup_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_box_id_boxes_id_fk" FOREIGN KEY ("related_box_id") REFERENCES "public"."boxes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_shipment_id_shipments_id_fk" FOREIGN KEY ("related_shipment_id") REFERENCES "public"."shipments"("id") ON DELETE set null ON UPDATE no action;