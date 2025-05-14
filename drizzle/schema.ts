import { pgTable, serial, text, integer, date, time, varchar, numeric, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { customType } from "drizzle-orm/pg-core";



export const records = pgTable("records", {
	recordId: serial("record_id").primaryKey().notNull(),
	caseType: text("case_type"),
	caseNo: integer("case_no"),
	datePickup: date("date_pickup"),
	timePickup: time("time_pickup", { withTimezone: true }),
	dateDropoff: date("date_dropoff"),
	timeDropoff: time("time_dropoff", { withTimezone: true }),
	doctorName: varchar("doctor_name", { length: 255 }).notNull(),
	clinicName: varchar("clinic_name", { length: 255 }).notNull(),
	patientName: varchar("patient_name", { length: 255 }).notNull(),
	upperUnit: integer("upper_unit"),
	lowerUnit: integer("lower_unit"),
	upperCost: integer("upper_cost"),
	lowerCost: integer("lower_cost"),
	description: text(),
	remarks: text(),
	totalAmount: numeric("total_amount", { precision: 10, scale: 2 }),
	paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }),
	excessPayment: numeric("excess_payment", { precision: 10, scale: 2 }),
	paymentMethod: text("payment_method"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	paymentStatus: text("payment_status").generatedAlwaysAs(sql`
CASE
    WHEN (paid_amount >= total_amount) THEN 'paid'::text
    ELSE 'unpaid'::text
END`),
});
export const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
	dataType() {
		return "bytea";
	},
});
export const history = pgTable("history", {
	historyId: serial("history_id").primaryKey().notNull(),
	historyType: varchar("history_type", { length: 255 }).notNull(),
	historyDate: date("history_date"),
	historyTime: time("history_time", { withTimezone: true }).default(sql`CURRENT_TIME`),
	recordId: integer("record_id").notNull(),
	// TODO: failed to parse database type 'bytea'
	imageData: bytea("image_data"),
});

export const supply = pgTable("supply", {
	supplyId: serial("supply_id").primaryKey().notNull(),
	supplyDate: date("supply_date").notNull(),
	supplyCost: numeric("supply_cost").notNull(),
	supplyDescription: text("supply_description"),
});

export const caseTypes = pgTable("case_types", {
	caseTypeId: serial("case_type_id").primaryKey().notNull(),
	caseTypeName: varchar("case_type_name", { length: 255 }).notNull(),
	numberOfCases: integer("number_of_cases").notNull(),
});

export const clinics = pgTable("clinics", {
	clinicId: serial("clinic_id").primaryKey().notNull(),
	clinicName: varchar("clinic_name", { length: 255 }).notNull(),
});

export const doctors = pgTable("doctors", {
	doctorId: serial("doctor_id").primaryKey().notNull(),
	doctorName: varchar("doctor_name", { length: 255 }).notNull(),
	clinicId: integer("clinic_id"),
});
