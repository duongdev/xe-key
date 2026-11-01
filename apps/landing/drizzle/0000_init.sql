CREATE TABLE "signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"platform" text NOT NULL,
	"language" text NOT NULL,
	"car" text,
	"features" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"survey_at" timestamp with time zone,
	CONSTRAINT "signups_email_unique" UNIQUE("email"),
	CONSTRAINT "signups_platform" CHECK ("signups"."platform" in ('ios', 'android')),
	CONSTRAINT "signups_language" CHECK ("signups"."language" in ('vi', 'en'))
);
