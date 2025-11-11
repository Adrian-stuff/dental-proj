CREATE TABLE "app_settings" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_types" (
	"case_type_id" serial PRIMARY KEY NOT NULL,
	"case_type_name" varchar(255) NOT NULL,
	"number_of_cases" integer NOT NULL,
	CONSTRAINT "case_types_case_type_name_key" UNIQUE("case_type_name")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"order_item_id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"up_or_down" varchar(255) NOT NULL,
	"case_type_id" integer NOT NULL,
	"case_no" serial NOT NULL,
	"item_cost" numeric NOT NULL,
	"item_quantity" integer NOT NULL,
	"order_description" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"order_id" serial PRIMARY KEY NOT NULL,
	"order_date" date NOT NULL,
	"order_total" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2),
	"excess_payment" numeric(10, 2),
	"payment_method" varchar(255) NOT NULL,
	"payment_status" varchar(255) GENERATED ALWAYS AS (
CASE
    WHEN (paid_amount >= order_total) THEN 'paid'::text
    ELSE 'unpaid'::text
END) STORED,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "supply" (
	"supply_id" serial PRIMARY KEY NOT NULL,
	"supply_date" date NOT NULL,
	"supply_cost" numeric NOT NULL,
	"supply_description" text
);
--> statement-breakpoint
ALTER TABLE "clinics" DROP CONSTRAINT "clinics_clinic_name_unique";--> statement-breakpoint
ALTER TABLE "doctors" DROP CONSTRAINT "doctors_clinic_id_clinics_clinic_id_fk";
--> statement-breakpoint
ALTER TABLE "history" ALTER COLUMN "history_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "history" ALTER COLUMN "history_time" SET DATA TYPE time with time zone;--> statement-breakpoint
ALTER TABLE "history" ALTER COLUMN "history_time" SET DEFAULT CURRENT_TIME;--> statement-breakpoint
ALTER TABLE "history" ALTER COLUMN "image_data" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "records" ALTER COLUMN "time_pickup" SET DATA TYPE time with time zone;--> statement-breakpoint
ALTER TABLE "records" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "records" ADD COLUMN "order_id" integer;--> statement-breakpoint
ALTER TABLE "records" ADD COLUMN "date_dropoff" date;--> statement-breakpoint
ALTER TABLE "records" ADD COLUMN "time_dropoff" time with time zone;--> statement-breakpoint
ALTER TABLE "records" ADD COLUMN "doctor_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "records" ADD COLUMN "remarks" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_case_type_id_fkey" FOREIGN KEY ("case_type_id") REFERENCES "public"."case_types"("case_type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_orders_payment_status" ON "orders" USING btree ("payment_status" text_ops);--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("clinic_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "public"."records"("record_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("doctor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_records_date_pickup" ON "records" USING btree ("date_pickup" date_ops);--> statement-breakpoint
CREATE INDEX "idx_records_doctor_id" ON "records" USING btree ("doctor_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_records_patient_name" ON "records" USING btree ("patient_name" text_ops);--> statement-breakpoint
ALTER TABLE "records" DROP COLUMN "case_type";--> statement-breakpoint
ALTER TABLE "records" DROP COLUMN "case_no";--> statement-breakpoint
ALTER TABLE "records" DROP COLUMN "doctor_name";--> statement-breakpoint
ALTER TABLE "records" DROP COLUMN "clinic_name";--> statement-breakpoint
ALTER TABLE "records" DROP COLUMN "total_amount";--> statement-breakpoint
ALTER TABLE "records" DROP COLUMN "paid_amount";--> statement-breakpoint
ALTER TABLE "records" DROP COLUMN "excess_payment";--> statement-breakpoint
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_clinic_name_key" UNIQUE("clinic_name");