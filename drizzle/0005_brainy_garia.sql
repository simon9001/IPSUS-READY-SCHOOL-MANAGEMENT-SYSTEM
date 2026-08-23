CREATE TYPE "public"."disciplinary_case_status" AS ENUM('opened', 'parent_summoned', 'hearing_held', 'bom_reviewed', 'decided', 'closed');--> statement-breakpoint
CREATE TYPE "public"."disciplinary_case_type" AS ENUM('suspension', 'expulsion');--> statement-breakpoint
CREATE TYPE "public"."disciplinary_decision" AS ENUM('suspended', 'expelled', 'reinstated', 'dismissed');--> statement-breakpoint
ALTER TYPE "public"."student_status" ADD VALUE 'suspended';--> statement-breakpoint
ALTER TYPE "public"."student_status" ADD VALUE 'expelled';--> statement-breakpoint
CREATE TABLE "conduct_point_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(30) NOT NULL,
	"description" varchar(200) NOT NULL,
	"points" integer NOT NULL,
	CONSTRAINT "conduct_point_rules_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "conduct_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"period_id" integer NOT NULL,
	"rule_id" integer,
	"points" integer NOT NULL,
	"reason" text,
	"discipline_record_id" integer,
	"awarded_by" integer NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disciplinary_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"discipline_record_id" integer,
	"case_type" "disciplinary_case_type" NOT NULL,
	"status" "disciplinary_case_status" DEFAULT 'opened' NOT NULL,
	"parent_summons_date" date,
	"parent_attended" boolean,
	"hearing_date" date,
	"hearing_panel" text,
	"hearing_notes" text,
	"bom_review_date" date,
	"bom_decision_notes" text,
	"decision" "disciplinary_decision",
	"suspension_start_date" date,
	"suspension_end_date" date,
	"re_admission_date" date,
	"opened_by" integer NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_by" integer,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "counseling_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"counselor_id" integer NOT NULL,
	"session_date" date NOT NULL,
	"category" varchar(40),
	"notes" text,
	"follow_up_required" boolean DEFAULT false NOT NULL,
	"follow_up_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conduct_points" ADD CONSTRAINT "conduct_points_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conduct_points" ADD CONSTRAINT "conduct_points_period_id_fiscal_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."fiscal_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conduct_points" ADD CONSTRAINT "conduct_points_rule_id_conduct_point_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."conduct_point_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conduct_points" ADD CONSTRAINT "conduct_points_discipline_record_id_discipline_records_id_fk" FOREIGN KEY ("discipline_record_id") REFERENCES "public"."discipline_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conduct_points" ADD CONSTRAINT "conduct_points_awarded_by_users_id_fk" FOREIGN KEY ("awarded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disciplinary_cases" ADD CONSTRAINT "disciplinary_cases_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disciplinary_cases" ADD CONSTRAINT "disciplinary_cases_discipline_record_id_discipline_records_id_fk" FOREIGN KEY ("discipline_record_id") REFERENCES "public"."discipline_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disciplinary_cases" ADD CONSTRAINT "disciplinary_cases_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disciplinary_cases" ADD CONSTRAINT "disciplinary_cases_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counseling_sessions" ADD CONSTRAINT "counseling_sessions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counseling_sessions" ADD CONSTRAINT "counseling_sessions_counselor_id_users_id_fk" FOREIGN KEY ("counselor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;