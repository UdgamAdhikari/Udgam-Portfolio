CREATE TYPE "public"."booking_status" AS ENUM('confirmed', 'cancelled');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"status" "booking_status" DEFAULT 'confirmed' NOT NULL,
	"notification" "notification_status" DEFAULT 'pending' NOT NULL,
	"notification_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_confirmed_start" ON "bookings" USING btree ("starts_at") WHERE "bookings"."status" = 'confirmed';--> statement-breakpoint
CREATE INDEX "bookings_starts_at" ON "bookings" USING btree ("starts_at");