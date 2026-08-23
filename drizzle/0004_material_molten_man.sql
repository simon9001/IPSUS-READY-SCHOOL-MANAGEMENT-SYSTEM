CREATE TYPE "public"."admission_status" AS ENUM('pending', 'interview_scheduled', 'admitted', 'waitlisted', 'rejected', 'enrolled');--> statement-breakpoint
CREATE TYPE "public"."admission_type" AS ENUM('placement', 'transfer', 'direct');--> statement-breakpoint
CREATE TABLE "admissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_no" varchar(30) NOT NULL,
	"admission_type" "admission_type" NOT NULL,
	"status" "admission_status" DEFAULT 'pending' NOT NULL,
	"first_name" varchar(80) NOT NULL,
	"last_name" varchar(80) NOT NULL,
	"other_names" varchar(80),
	"gender" varchar(10),
	"date_of_birth" date,
	"guardian_name" varchar(150),
	"guardian_phone" varchar(30),
	"guardian_email" varchar(150),
	"target_class_id" integer NOT NULL,
	"boarding_status" varchar(10) DEFAULT 'day' NOT NULL,
	"nemis_upi" varchar(30),
	"placement_letter_ref" varchar(60),
	"kcpe_kpsea_index_no" varchar(30),
	"previous_institution_code" varchar(30),
	"previous_school_name" varchar(150),
	"previous_school_code" varchar(30),
	"transfer_reason" text,
	"transfer_certificate_ref" varchar(60),
	"interview_date" date,
	"interviewer_id" integer,
	"interview_score" numeric(5, 2),
	"interview_notes" text,
	"decided_by" integer,
	"decided_at" timestamp with time zone,
	"rejection_reason" text,
	"student_id" integer,
	"enrolled_at" timestamp with time zone,
	"recorded_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admissions_application_no_unique" UNIQUE("application_no")
);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "nemis_upi" varchar(30);--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_target_class_id_classes_id_fk" FOREIGN KEY ("target_class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_interviewer_id_users_id_fk" FOREIGN KEY ("interviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_nemis_upi_unique" UNIQUE("nemis_upi");