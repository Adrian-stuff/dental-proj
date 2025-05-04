CREATE TABLE "history" (
	"history_id" serial PRIMARY KEY NOT NULL,
	"history_type" varchar(255) NOT NULL,
	"history_date" date NOT NULL,
	"history_time" time,
	"image_data" "bytea" NOT NULL,
	"record_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "records" ADD COLUMN "time_pickup" time;