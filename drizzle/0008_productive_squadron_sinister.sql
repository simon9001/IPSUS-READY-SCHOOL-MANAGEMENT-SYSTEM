CREATE TYPE "public"."compliance_report_status" AS ENUM('draft', 'submitted');--> statement-breakpoint
CREATE TYPE "public"."compliance_report_type" AS ENUM('nemis_enrollment', 'tsc_staffing', 'moe_capitation');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('issued', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('leaving_certificate', 'transcript', 'admission_letter', 'fee_clearance_letter', 'conduct_certificate', 'custom_letter');--> statement-breakpoint
CREATE TABLE "compliance_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_type" "compliance_report_type" NOT NULL,
	"period_id" integer NOT NULL,
	"report_data" jsonb NOT NULL,
	"status" "compliance_report_status" DEFAULT 'draft' NOT NULL,
	"reference_number" varchar(60),
	"generated_by" integer NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_by" integer,
	"submitted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "document_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(60) NOT NULL,
	"document_type" "document_type" NOT NULL,
	"body_template" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "document_templates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "generated_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_number" varchar(40) NOT NULL,
	"document_type" "document_type" NOT NULL,
	"student_id" integer,
	"template_id" integer,
	"content" text NOT NULL,
	"status" "document_status" DEFAULT 'issued' NOT NULL,
	"issued_by" integer NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "generated_documents_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_period_id_fiscal_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."fiscal_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_template_id_document_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."document_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;