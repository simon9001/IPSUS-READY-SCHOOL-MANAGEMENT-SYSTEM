CREATE TYPE "public"."message_batch_status" AS ENUM('queued', 'sending', 'completed');--> statement-breakpoint
CREATE TYPE "public"."message_channel" AS ENUM('sms', 'email', 'both');--> statement-breakpoint
ALTER TYPE "public"."notification_status" ADD VALUE 'sending';--> statement-breakpoint
ALTER TYPE "public"."notification_status" ADD VALUE 'skipped';--> statement-breakpoint
CREATE TABLE "message_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_by" integer NOT NULL,
	"channel" "message_channel" NOT NULL,
	"audiences" jsonb NOT NULL,
	"subject" varchar(150),
	"body" text NOT NULL,
	"status" "message_batch_status" DEFAULT 'queued' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "recipient_name" varchar(150);--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "batch_id" integer;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "message_batches" ADD CONSTRAINT "message_batches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_batch_id_message_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."message_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_batch_id_status_idx" ON "notifications" USING btree ("batch_id","status");