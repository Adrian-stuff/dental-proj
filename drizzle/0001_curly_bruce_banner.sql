CREATE TABLE "clinics" (
	"clinic_id" serial PRIMARY KEY NOT NULL,
	"clinic_name" varchar(255) NOT NULL,
	CONSTRAINT "clinics_clinic_name_unique" UNIQUE("clinic_name")
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"doctor_id" serial PRIMARY KEY NOT NULL,
	"doctor_name" varchar(255) NOT NULL,
	"clinic_id" integer
);
--> statement-breakpoint
CREATE TABLE "records" (
	"record_id" serial PRIMARY KEY NOT NULL,
	"case_type" text,
	"case_no" serial NOT NULL,
	"date_pickup" date,
	"doctor_name" varchar(255) NOT NULL,
	"clinic_name" varchar(255) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"description" text,
	"total_amount" numeric(10, 2),
	"paid_amount" numeric(10, 2),
	"excess_payment" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DROP TABLE "user" CASCADE;--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_clinic_id_clinics_clinic_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("clinic_id") ON DELETE no action ON UPDATE no action;