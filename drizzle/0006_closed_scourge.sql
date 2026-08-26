CREATE TYPE "public"."bed_allocation_status" AS ENUM('active', 'vacated');--> statement-breakpoint
CREATE TYPE "public"."boarding_attendance_status" AS ENUM('present', 'absent', 'on_leave');--> statement-breakpoint
CREATE TYPE "public"."dormitory_gender" AS ENUM('boys', 'girls', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."dormitory_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."condition_severity" AS ENUM('mild', 'moderate', 'severe');--> statement-breakpoint
CREATE TYPE "public"."route_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."transport_allocation_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "bed_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"dormitory_id" integer NOT NULL,
	"bed_number" varchar(20) NOT NULL,
	"period_id" integer NOT NULL,
	"allocated_date" date NOT NULL,
	"vacated_date" date,
	"status" "bed_allocation_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boarding_attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"attendance_date" date NOT NULL,
	"status" "boarding_attendance_status" NOT NULL,
	"remarks" text,
	"recorded_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "boarding_attendance_student_id_attendance_date_unique" UNIQUE("student_id","attendance_date")
);
--> statement-breakpoint
CREATE TABLE "dormitories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"gender" "dormitory_gender" NOT NULL,
	"capacity" integer NOT NULL,
	"warden_staff_id" integer,
	"status" "dormitory_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinic_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"visit_date" date NOT NULL,
	"presenting_complaint" text NOT NULL,
	"diagnosis" text,
	"treatment_given" text,
	"referred_to_hospital" boolean DEFAULT false NOT NULL,
	"referral_notes" text,
	"attended_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_conditions" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"condition" varchar(150) NOT NULL,
	"severity" "condition_severity" DEFAULT 'mild' NOT NULL,
	"diagnosed_date" date,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"recorded_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medication_administrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"clinic_visit_id" integer,
	"medical_condition_id" integer,
	"medication_name" varchar(150) NOT NULL,
	"dosage" varchar(100),
	"administered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"administered_by" integer NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "bus_routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"route_name" varchar(100) NOT NULL,
	"vehicle_registration" varchar(30),
	"driver_name" varchar(150),
	"driver_phone" varchar(30),
	"capacity" integer,
	"fee_amount" numeric(12, 2),
	"status" "route_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_stops" (
	"id" serial PRIMARY KEY NOT NULL,
	"route_id" integer NOT NULL,
	"stop_name" varchar(150) NOT NULL,
	"stop_order" integer NOT NULL,
	"pickup_time" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "student_transport_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"route_id" integer NOT NULL,
	"stop_id" integer,
	"period_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" "transport_allocation_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bed_allocations" ADD CONSTRAINT "bed_allocations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed_allocations" ADD CONSTRAINT "bed_allocations_dormitory_id_dormitories_id_fk" FOREIGN KEY ("dormitory_id") REFERENCES "public"."dormitories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed_allocations" ADD CONSTRAINT "bed_allocations_period_id_fiscal_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."fiscal_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boarding_attendance" ADD CONSTRAINT "boarding_attendance_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boarding_attendance" ADD CONSTRAINT "boarding_attendance_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dormitories" ADD CONSTRAINT "dormitories_warden_staff_id_staff_id_fk" FOREIGN KEY ("warden_staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinic_visits" ADD CONSTRAINT "clinic_visits_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinic_visits" ADD CONSTRAINT "clinic_visits_attended_by_users_id_fk" FOREIGN KEY ("attended_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_conditions" ADD CONSTRAINT "medical_conditions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_conditions" ADD CONSTRAINT "medical_conditions_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_administrations" ADD CONSTRAINT "medication_administrations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_administrations" ADD CONSTRAINT "medication_administrations_clinic_visit_id_clinic_visits_id_fk" FOREIGN KEY ("clinic_visit_id") REFERENCES "public"."clinic_visits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_administrations" ADD CONSTRAINT "medication_administrations_medical_condition_id_medical_conditions_id_fk" FOREIGN KEY ("medical_condition_id") REFERENCES "public"."medical_conditions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_administrations" ADD CONSTRAINT "medication_administrations_administered_by_users_id_fk" FOREIGN KEY ("administered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_bus_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."bus_routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_transport_allocations" ADD CONSTRAINT "student_transport_allocations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_transport_allocations" ADD CONSTRAINT "student_transport_allocations_route_id_bus_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."bus_routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_transport_allocations" ADD CONSTRAINT "student_transport_allocations_stop_id_route_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."route_stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_transport_allocations" ADD CONSTRAINT "student_transport_allocations_period_id_fiscal_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."fiscal_periods"("id") ON DELETE no action ON UPDATE no action;