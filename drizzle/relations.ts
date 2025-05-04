import { relations } from "drizzle-orm/relations";
import { clinics, doctors } from "./schema";

export const doctorsRelations = relations(doctors, ({one}) => ({
	clinic: one(clinics, {
		fields: [doctors.clinicId],
		references: [clinics.clinicId]
	}),
}));

export const clinicsRelations = relations(clinics, ({many}) => ({
	doctors: many(doctors),
}));