import { pgTable, unique, serial, varchar, foreignKey, integer, index, text, date, time, numeric, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const clinics = pgTable("clinics", {
	clinicId: serial("clinic_id").primaryKey().notNull(),
	clinicName: varchar("clinic_name", { length: 255 }).notNull(),
}, (table) => [
	unique("clinics_clinic_name_key").on(table.clinicName),
]);

export const doctors = pgTable("doctors", {
	doctorId: serial("doctor_id").primaryKey().notNull(),
	doctorName: varchar("doctor_name", { length: 255 }).notNull(),
	clinicId: integer("clinic_id"),
}, (table) => [
	foreignKey({
			columns: [table.clinicId],
			foreignColumns: [clinics.clinicId],
			name: "doctors_clinic_id_fkey"
		}),
]);

export const records = pgTable("records", {
	recordId: serial("record_id").primaryKey().notNull(),
	caseType: text("case_type"),
	caseNo: serial("case_no").notNull(),
	datePickup: date("date_pickup"),
	timePickup: time("time_pickup", { withTimezone: true }),
	doctorName: varchar("doctor_name", { length: 255 }).notNull(),
	clinicName: varchar("clinic_name", { length: 255 }).notNull(),
	patientName: varchar("patient_name", { length: 255 }).notNull(),
	description: text(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }),
	paidAmount: numeric("paid_amount", { precision: 10, scale:  2 }),
	excessPayment: numeric("excess_payment", { precision: 10, scale:  2 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_records_clinic_name").using("btree", table.clinicName.asc().nullsLast().op("text_ops")),
	index("idx_records_date_pickup").using("btree", table.datePickup.asc().nullsLast().op("date_ops")),
	index("idx_records_doctor_name").using("btree", table.doctorName.asc().nullsLast().op("text_ops")),
	index("idx_records_patient_name").using("btree", table.patientName.asc().nullsLast().op("text_ops")),
]);

export const history = pgTable("history", {
	historyId: serial("history_id").primaryKey().notNull(),
	historyType: varchar("history_type", { length: 255 }).notNull(),
	historyDate: date("history_date"),
	hitoryTime: time("hitory_time", { withTimezone: true }).default(sql`CURRENT_TIME`),
	recordId: integer("record_id").notNull(),
	// TODO: failed to parse database type 'bytea'
	imageData: unknown("image_data"),
});
