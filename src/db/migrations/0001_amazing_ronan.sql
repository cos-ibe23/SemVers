CREATE TYPE "public"."vouch_status" AS ENUM('PENDING', 'APPROVED', 'DECLINED');--> statement-breakpoint
CREATE TABLE "user_vouches" (
	"id" serial PRIMARY KEY NOT NULL,
	"requester_user_id" text NOT NULL,
	"voucher_email" varchar(255) NOT NULL,
	"voucher_user_id" text,
	"status" "vouch_status" DEFAULT 'PENDING',
	"token" varchar(128),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "verification_status" varchar(20) DEFAULT 'UNVERIFIED' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_vouches" ADD CONSTRAINT "user_vouches_requester_user_id_user_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_vouches" ADD CONSTRAINT "user_vouches_voucher_user_id_user_id_fk" FOREIGN KEY ("voucher_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;