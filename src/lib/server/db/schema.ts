import {
	serial,
	varchar,
	text,
	date,
	decimal,
	timestamp,
	pgTable,
	unique,
	integer,
	customType,
	time,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

export const caseTypes = pgTable("case_types", {
	caseTypeId: serial("case_type_id").primaryKey(),
	caseType: varchar("case_type_name", { length: 255 }).notNull(),
	numberOfCases: integer("number_of_cases").notNull(),
});
// Table for Clinics
export const clinics = pgTable("clinics", {
	clinicId: serial("clinic_id").primaryKey(),
	clinicName: varchar("clinic_name", { length: 255 }).notNull().unique(),
});

export const clinicsRelations = relations(clinics, ({ many }) => ({
	doctors: many(doctors),
	records: many(records),
}));

// Table for Doctors
export const doctors = pgTable("doctors", {
	doctorId: serial("doctor_id").primaryKey(),
	doctorName: varchar("doctor_name", { length: 255 }).notNull(),
	clinicId: integer("clinic_id")
		.references(() => clinics.clinicId),
});

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
	clinic: one(clinics, {
		fields: [doctors.clinicId],
		references: [clinics.clinicId],
	}),
	records: many(records),
}));

export const supply = pgTable("supply", {
	supplyId: serial("supply_id").primaryKey(),
	supplyDate: date("supply_date").notNull(),
	supplyCost: decimal("supply_cost").notNull(),
	supplyDescription: text("supply_description"),
});

// Table for Records
export const records = pgTable("records", {
	recordId: serial("record_id").primaryKey(),
	caseType: text("case_type"),
	caseNo: serial("case_no"),
	datePickup: date("date_pickup"),
	timePickup: time("time_pickup"),
	dateDropoff: date("date_dropoff"),
	timeDropoff: time("time_dropoff"),
	doctorName: varchar("doctor_name", { length: 255 }).notNull(),
	clinicName: varchar("clinic_name", { length: 255 }).notNull(),
	patientName: varchar("patient_name", { length: 255 }).notNull(),
	description: text("description"),
	totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
	paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
	excessPayment: decimal("excess_payment", { precision: 10, scale: 2 }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow(),
	remarks: text("remarks"),
	paymentMethod: text("payment_method"),
	paymentStatus: text("payment_status"),

});

export const recordsRelations = relations(records, ({ one }) => ({

	doctor: one(doctors, {
		fields: [records.doctorName],
		references: [doctors.doctorName],
	}),
	clinic: one(clinics, {
		fields: [records.clinicName],
		references: [clinics.clinicName],
	}),
}));
export const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
	dataType() {
		return "bytea";
	},
});
// Table for History
export const history = pgTable("history", {
	historyId: serial("history_id").primaryKey(),
	historyType: varchar("history_type", { length: 255 }).notNull(),
	historyDate: date("history_date").notNull(),
	historyTime: time("history_time"),
	imageData: bytea("image_data").notNull(),
	recordId: integer("record_id").notNull(), // Foreign key to records table
});

