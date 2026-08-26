CREATE TYPE "public"."day_of_week" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');--> statement-breakpoint
CREATE TYPE "public"."book_status" AS ENUM('active', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."borrowing_status" AS ENUM('borrowed', 'returned', 'lost');--> statement-breakpoint
CREATE TYPE "public"."club_category" AS ENUM('club', 'sport', 'society');--> statement-breakpoint
CREATE TYPE "public"."club_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."competition_level" AS ENUM('school', 'zonal', 'county', 'regional', 'national');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "exam_timetable_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id" integer NOT NULL,
	"subject_id" integer NOT NULL,
	"exam_date" date NOT NULL,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) NOT NULL,
	"venue" varchar(100),
	CONSTRAINT "exam_timetable_entries_exam_id_subject_id_unique" UNIQUE("exam_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "lesson_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(40) NOT NULL,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_id" integer NOT NULL,
	"stream_id" integer,
	"subject_id" integer NOT NULL,
	"teacher_id" integer NOT NULL,
	"lesson_period_id" integer NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"period_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_borrowings" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"borrowed_date" date NOT NULL,
	"due_date" date NOT NULL,
	"returned_date" date,
	"status" "borrowing_status" DEFAULT 'borrowed' NOT NULL,
	"fine_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"fine_paid" boolean DEFAULT false NOT NULL,
	"issued_by" integer NOT NULL,
	"returned_to" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_books" (
	"id" serial PRIMARY KEY NOT NULL,
	"isbn" varchar(20),
	"title" varchar(200) NOT NULL,
	"author" varchar(150),
	"category" varchar(60),
	"total_copies" integer DEFAULT 1 NOT NULL,
	"status" "book_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"club_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"joined_date" date NOT NULL,
	"role" varchar(60),
	"status" "membership_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" "club_category" DEFAULT 'club' NOT NULL,
	"patron_staff_id" integer,
	"description" text,
	"status" "club_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"competition_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"result" varchar(100),
	"achievement" text
);
--> statement-breakpoint
CREATE TABLE "competitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"club_id" integer,
	"level" "competition_level" DEFAULT 'school' NOT NULL,
	"competition_date" date NOT NULL,
	"venue" varchar(150)
);
--> statement-breakpoint
ALTER TABLE "exam_timetable_entries" ADD CONSTRAINT "exam_timetable_entries_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_timetable_entries" ADD CONSTRAINT "exam_timetable_entries_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_lesson_period_id_lesson_periods_id_fk" FOREIGN KEY ("lesson_period_id") REFERENCES "public"."lesson_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_period_id_fiscal_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."fiscal_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_borrowings" ADD CONSTRAINT "book_borrowings_book_id_library_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."library_books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_borrowings" ADD CONSTRAINT "book_borrowings_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_borrowings" ADD CONSTRAINT "book_borrowings_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_borrowings" ADD CONSTRAINT "book_borrowings_returned_to_users_id_fk" FOREIGN KEY ("returned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_patron_staff_id_staff_id_fk" FOREIGN KEY ("patron_staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_participants" ADD CONSTRAINT "competition_participants_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_participants" ADD CONSTRAINT "competition_participants_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;