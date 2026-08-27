CREATE TABLE "subject_strands" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	CONSTRAINT "subject_strands_subject_id_name_unique" UNIQUE("subject_id","name")
);
--> statement-breakpoint
CREATE TABLE "exam_strand_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"strand_id" integer NOT NULL,
	"marks" numeric(5, 2),
	"max_marks" numeric(5, 2) DEFAULT '100' NOT NULL,
	"grade" varchar(30),
	"points" numeric(4, 2),
	"remarks" text,
	"entered_by" integer NOT NULL,
	"entered_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exam_strand_results_exam_id_student_id_strand_id_unique" UNIQUE("exam_id","student_id","strand_id")
);
--> statement-breakpoint
ALTER TABLE "subject_strands" ADD CONSTRAINT "subject_strands_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_strand_results" ADD CONSTRAINT "exam_strand_results_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_strand_results" ADD CONSTRAINT "exam_strand_results_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_strand_results" ADD CONSTRAINT "exam_strand_results_strand_id_subject_strands_id_fk" FOREIGN KEY ("strand_id") REFERENCES "public"."subject_strands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_strand_results" ADD CONSTRAINT "exam_strand_results_entered_by_users_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;