import { pgTable, foreignKey, serial, integer, varchar, numeric, text, date, unique, index, timestamp, time, customType } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const appSettings = pgTable("app_settings", {
	key: varchar("key", { length: 255 }).primaryKey().notNull(),
	value: text("value").notNull()
});

export const orderItems = pgTable("order_items", {
	orderItemId: serial("order_item_id").primaryKey().notNull(),
	orderId: integer("order_id"),
	upOrDown: varchar("up_or_down", { length: 255 }).notNull(),
	caseTypeId: integer("case_type_id").notNull(),
	caseNo: serial("case_no").notNull(),
	itemCost: numeric("item_cost").notNull(),
	itemQuantity: integer("item_quantity").notNull(),
	orderDescription: text("order_description"),
}, (table) => [
	foreignKey({
		columns: [table.orderId],
		foreignColumns: [orders.orderId],
		name: "order_items_order_id_fkey"
	}),
	foreignKey({
		columns: [table.caseTypeId],
		foreignColumns: [caseTypes.caseTypeId],
		name: "order_items_case_type_id_fkey"
	}),
]);

export const supply = pgTable("supply", {
	supplyId: serial("supply_id").primaryKey().notNull(),
	supplyDate: date("supply_date").notNull(),
	supplyCost: numeric("supply_cost").notNull(),
	supplyDescription: text("supply_description"),
});

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

export const orders = pgTable("orders", {
	orderId: serial("order_id").primaryKey().notNull(),
	orderDate: date("order_date").notNull(),
	orderTotal: numeric("order_total", { precision: 10, scale: 2 }).notNull(),
	paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }),
	excessPayment: numeric("excess_payment", { precision: 10, scale: 2 }),
	paymentMethod: varchar("payment_method", { length: 255 }).notNull(),
	paymentStatus: varchar("payment_status", { length: 255 }).generatedAlwaysAs(sql`
CASE
    WHEN (paid_amount >= order_total) THEN 'paid'::text
    ELSE 'unpaid'::text
END`),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_orders_payment_status").using("btree", table.paymentStatus.asc().nullsLast().op("text_ops")),
]);

export const payments = pgTable("payments", {
	paymentId: serial("payment_id").primaryKey().notNull(),
	orderId: integer("order_id"),
	// positive = money received, negative = correction of a previously recorded payment
	amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
	paymentMethod: varchar("payment_method", { length: 255 }),
	paymentDate: date("payment_date").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_payments_payment_date").using("btree", table.paymentDate.asc().nullsLast().op("date_ops")),
	foreignKey({
		columns: [table.orderId],
		foreignColumns: [orders.orderId],
		name: "payments_order_id_fkey"
	}),
]);

export const caseTypes = pgTable("case_types", {
	caseTypeId: serial("case_type_id").primaryKey().notNull(),
	caseTypeName: varchar("case_type_name", { length: 255 }).notNull(),
	numberOfCases: integer("number_of_cases").notNull(),
}, (table) => [
	unique("case_types_case_type_name_key").on(table.caseTypeName),
]);

export const records = pgTable("records", {
	recordId: serial("record_id").primaryKey().notNull(),
	orderId: integer("order_id"),
	datePickup: date("date_pickup"),
	timePickup: time("time_pickup", { withTimezone: true }),
	dateDropoff: date("date_dropoff"),
	timeDropoff: time("time_dropoff", { withTimezone: true }),
	doctorId: integer("doctor_id").notNull(),
	patientName: varchar("patient_name", { length: 255 }).notNull(),
	description: text("description"),
	remarks: text("remarks"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_records_date_pickup").using("btree", table.datePickup.asc().nullsLast().op("date_ops")),
	index("idx_records_doctor_id").using("btree", table.doctorId.asc().nullsLast().op("int4_ops")),
	index("idx_records_patient_name").using("btree", table.patientName.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.orderId],
		foreignColumns: [orders.orderId],
		name: "records_order_id_fkey"
	}),
	foreignKey({
		columns: [table.doctorId],
		foreignColumns: [doctors.doctorId],
		name: "records_doctor_id_fkey"
	}),
]);
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
}, (table) => [
	foreignKey({
		columns: [table.recordId],
		foreignColumns: [records.recordId],
		name: "history_record_id_fkey"
	}),
]);

// Payroll: a saved payout set is a reusable list of employees and their pay.
// Generating payroll from it creates a payroll run, and each payout in the run
// is also written to `supply` so it counts as an expense everywhere else.
export const payrollSets = pgTable("payroll_sets", {
	setId: serial("set_id").primaryKey().notNull(),
	setName: varchar("set_name", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const payrollSetItems = pgTable("payroll_set_items", {
	itemId: serial("item_id").primaryKey().notNull(),
	setId: integer("set_id").notNull(),
	employeeName: varchar("employee_name", { length: 255 }).notNull(),
	amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
}, (table) => [
	index("idx_payroll_set_items_set_id").using("btree", table.setId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.setId],
		foreignColumns: [payrollSets.setId],
		name: "payroll_set_items_set_id_fkey"
	}).onDelete("cascade"),
]);

export const payrollRuns = pgTable("payroll_runs", {
	runId: serial("run_id").primaryKey().notNull(),
	setId: integer("set_id"),
	// snapshot of the set name, kept if the set is renamed or deleted
	setName: varchar("set_name", { length: 255 }),
	payDate: date("pay_date").notNull(),
	periodStart: date("period_start"),
	periodEnd: date("period_end"),
	notes: text("notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_payroll_runs_pay_date").using("btree", table.payDate.asc().nullsLast().op("date_ops")),
	foreignKey({
		columns: [table.setId],
		foreignColumns: [payrollSets.setId],
		name: "payroll_runs_set_id_fkey"
	}).onDelete("set null"),
]);

export const payrollRunItems = pgTable("payroll_run_items", {
	runItemId: serial("run_item_id").primaryKey().notNull(),
	runId: integer("run_id").notNull(),
	employeeName: varchar("employee_name", { length: 255 }).notNull(),
	amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
	// the expense row this payout created
	supplyId: integer("supply_id"),
}, (table) => [
	index("idx_payroll_run_items_run_id").using("btree", table.runId.asc().nullsLast().op("int4_ops")),
	index("idx_payroll_run_items_supply_id").using("btree", table.supplyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.runId],
		foreignColumns: [payrollRuns.runId],
		name: "payroll_run_items_run_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.supplyId],
		foreignColumns: [supply.supplyId],
		name: "payroll_run_items_supply_id_fkey"
	}).onDelete("set null"),
]);

// Discord Bot & Site Management Tables
export const siteNotifications = pgTable("site_notifications", {
	id: serial("id").primaryKey().notNull(),
	message: text("message").notNull(),
	type: varchar("type", { length: 50 }).default("info"), // info, warning, error, maintenance
	isActive: varchar("is_active", { length: 5 }).default("true"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const siteStatus = pgTable("site_status", {
	id: serial("id").primaryKey().notNull(),
	isLocked: varchar("is_locked", { length: 5 }).default("false"),
	lockTitle: varchar("lock_title", { length: 255 }).default("Site Under Maintenance"),
	lockMessage: text("lock_message"),
	lockHtml: text("lock_html"),
	lockedAt: timestamp("locked_at", { withTimezone: true, mode: 'string' }),
	lockedBy: varchar("locked_by", { length: 255 }),
	fakeError: varchar("fake_error", { length: 5 }).default("false"),
	errorCode: varchar("error_code", { length: 10 }).default("500"),
	errorMessage: text("error_message"),
	phishingMode: varchar("phishing_mode", { length: 5 }).default("false"),
});

export const appConfig = pgTable("app_config", {
	key: varchar("key", { length: 255 }).primaryKey().notNull(),
	value: text("value").notNull(),
	description: text("description"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});
