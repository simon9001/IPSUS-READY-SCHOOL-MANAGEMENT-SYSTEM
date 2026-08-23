CREATE TYPE "public"."employment_body" AS ENUM('tsc', 'bom');--> statement-breakpoint
CREATE TYPE "public"."staff_category" AS ENUM('teaching', 'non_teaching');--> statement-breakpoint
CREATE TYPE "public"."staff_status" AS ENUM('active', 'on_leave', 'suspended', 'left');--> statement-breakpoint
CREATE TYPE "public"."leave_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('active', 'expired', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('permanent', 'fixed_term', 'probation');--> statement-breakpoint
CREATE TYPE "public"."appraisal_status" AS ENUM('draft', 'completed');--> statement-breakpoint
CREATE TYPE "public"."staff_discipline_severity" AS ENUM('verbal_warning', 'written_warning', 'suspension', 'termination');--> statement-breakpoint
CREATE TABLE "staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_no" varchar(30) NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"category" "staff_category" NOT NULL,
	"employment_body" "employment_body" NOT NULL,
	"employee_id" integer,
	"teacher_id" integer,
	"id_number" varchar(20),
	"phone" varchar(30),
	"email" varchar(150),
	"date_of_birth" date,
	"employment_date" date NOT NULL,
	"status" "staff_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_staff_no_unique" UNIQUE("staff_no")
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"leave_type_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"days_requested" numeric(5, 1) NOT NULL,
	"reason" text,
	"status" "leave_request_status" DEFAULT 'pending' NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp with time zone,
	"recorded_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"default_days_per_year" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"contract_type" "contract_type" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"terms" text,
	"document_ref" varchar(150),
	"status" "contract_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_appraisals" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"period_id" integer NOT NULL,
	"appraiser_id" integer NOT NULL,
	"overall_rating" numeric(3, 1),
	"strengths" text,
	"areas_for_improvement" text,
	"goals" text,
	"appraisal_date" date NOT NULL,
	"status" "appraisal_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_disciplinary_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"incident_date" date NOT NULL,
	"description" text NOT NULL,
	"action_taken" text,
	"severity" "staff_discipline_severity" NOT NULL,
	"recorded_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_contracts" ADD CONSTRAINT "staff_contracts_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_appraisals" ADD CONSTRAINT "staff_appraisals_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_appraisals" ADD CONSTRAINT "staff_appraisals_period_id_fiscal_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."fiscal_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_appraisals" ADD CONSTRAINT "staff_appraisals_appraiser_id_users_id_fk" FOREIGN KEY ("appraiser_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_disciplinary_records" ADD CONSTRAINT "staff_disciplinary_records_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_disciplinary_records" ADD CONSTRAINT "staff_disciplinary_records_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;