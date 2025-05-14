import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { clinics, doctors, caseTypes } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export const load = (async () => {
  const doctorsData = (await db.select().from(doctors).orderBy(desc(doctors.doctorName))).map((doctor) => ({
    value: doctor.doctorName,
    label: doctor.doctorName,
    clinicId: doctor.clinicId
  })),
    clinicsData = (await db.select().from(clinics).orderBy(desc(clinics.clinicName))).map((clinic) => ({
      value: clinic.clinicName,
      label: clinic.clinicName,
      clinicId: clinic.clinicId
    })),
    caseTypesData = await db.select().from(caseTypes).orderBy(caseTypes.caseType);

  return {
    doctors: doctorsData,
    clinics: clinicsData,
    caseTypes: caseTypesData
  };
}) satisfies PageServerLoad;

export const actions = {
  addDoctor: async ({ request }) => {
    const data = await request.formData();
    const doctorName = data.get('doctor_name')?.toString();
    const clinicId = data.get('clinic_id')?.toString();

    if (doctorName && clinicId) {
      try {
        await db.insert(doctors).values({
          doctorName: doctorName,
          clinicId: parseInt(clinicId)
        } as unknown as typeof doctors.$inferInsert);
        return { success: true, message: `Doctor "${doctorName}" added successfully to clinic ID ${clinicId}` };
      } catch (error) {
        console.error('Error inserting doctor:', error);
        return { success: false, error: 'Failed to add doctor' };
      }
    } else {
      return { success: false, error: 'Doctor name and clinic selection are required' };
    }
  },
  addClinic: async ({ request }) => {
    const data = await request.formData();
    const clinicName = data.get('clinic_name')?.toString();

    if (clinicName) {
      try {
        const result = await db
          .insert(clinics)
          .values({ clinicName: clinicName } as unknown as typeof clinics.$inferInsert)
          .returning({ clinicId: clinics.clinicId });
        if (result && result.length > 0 && result[0].clinicId) {
          return { success: true, message: `Clinic "${clinicName}" added successfully`, clinicId: result[0].clinicId };
        } else {
          return { success: false, error: 'Failed to add clinic and get ID' };
        }
      } catch (error) {
        console.error('Error inserting clinic:', error);
        return { success: false, error: 'Failed to add clinic' };
      }
    } else {
      return { success: false, error: 'Clinic name is required' };
    }
  },
  addClinicAndDoctor: async ({ request }) => {
    const data = await request.formData();
    const clinicName = data.get('clinic_name')?.toString();
    const doctorName = data.get('doctor_name')?.toString();

    if (clinicName && doctorName) {
      try {
        const clinicResult = await db
          .insert(clinics)
          .values({ clinicName: clinicName } as unknown as typeof clinics.$inferInsert)
          .returning({ clinicId: clinics.clinicId });

        if (clinicResult && clinicResult.length > 0 && clinicResult[0].clinicId) {
          const newClinicId = clinicResult[0].clinicId;
          await db.insert(doctors).values({
            doctorName: doctorName,
            clinicId: newClinicId
          } as unknown as typeof doctors.$inferInsert);
          return {
            success: true,
            message: `Clinic "${clinicName}" and doctor "${doctorName}" added successfully`
          };
        } else {
          return { success: false, error: 'Failed to add clinic and get ID for doctor' };
        }
      } catch (error) {
        console.error('Error inserting clinic and doctor:', error);
        return { success: false, error: 'Failed to add clinic and doctor' };
      }
    } else {
      return { success: false, error: 'Clinic name and doctor name are required' };
    }
  },
  deleteDoctor: async ({ request }) => {
    const data = await request.formData();
    const doctorIdToDelete = data.get('doctor_id')?.toString();

    if (doctorIdToDelete) {
      try {
        await db.delete(doctors).where(eq(doctors.clinicId, parseInt(doctorIdToDelete))); // Assuming doctor_id in the form corresponds to clinicId in doctors table based on previous code
        return { success: true, message: `Doctor with ID ${doctorIdToDelete} deleted successfully` };
      } catch (error) {
        console.error('Error deleting doctor:', error);
        return { success: false, error: 'Failed to delete doctor' };
      }
    } else {
      return { success: false, error: 'Doctor ID not provided for deletion' };
    }
  },
  deleteClinic: async ({ request }) => {
    const data = await request.formData();
    const clinicIdToDelete = data.get('clinic_id')?.toString();

    if (clinicIdToDelete) {
      try {
        await db.transaction(async (tx) => {
          // First, delete all doctors associated with this clinic
          await tx.delete(doctors).where(eq(doctors.clinicId, parseInt(clinicIdToDelete)));
          // Then, delete the clinic itself
          await tx.delete(clinics).where(eq(clinics.clinicId, parseInt(clinicIdToDelete)));
        });
        return { success: true, message: `Clinic with ID ${clinicIdToDelete} and associated doctors deleted successfully` };
      } catch (error) {
        console.error('Error deleting clinic and associated doctors:', error);
        return { success: false, error: 'Failed to delete clinic and associated doctors' };
      }
    } else {
      return { success: false, error: 'Clinic ID not provided for deletion' };
    }
  },
  addCaseType: async ({ request }) => {
    const data = await request.formData();
    const caseType = data.get('case_type')?.toString();

    if (!caseType) {
      return { success: false, error: 'Case type is required' };
    }

    try {
      await db.insert(caseTypes).values({
        caseType: caseType,
        numberOfCases: 0
      } as unknown as typeof caseTypes.$inferInsert);

      return {
        success: true,
        message: 'Case type added successfully'
      };
    } catch (error) {
      console.error('Error adding case type:', error);
      return { success: false, error: 'Failed to add case type' };
    }
  },
  deleteCaseType: async ({ request }) => {
    const data = await request.formData();
    const caseTypeId = data.get('case_type_id')?.toString();

    if (!caseTypeId) {
      return { success: false, error: 'Case type ID is required' };
    }

    try {
      await db.delete(caseTypes).where(eq(caseTypes.caseTypeId, caseTypeId));

      return {
        success: true,
        message: 'Case type deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting case type:', error);
      return { success: false, error: 'Failed to delete case type' };
    }
  },
  addField: async ({ request }) => {
    const formData = await request.formData();
    const caseTypeId = formData.get('case_type_id');
    const fieldName = formData.get('field_name')?.toString();

    if (!fieldName) {
      return {
        success: false,
        error: 'Field name is required'
      };
    }

    try {
      // First get the current fields
      const caseType = await db
        .select()
        .from(caseTypes)
        .where(sql`case_type_id = ${caseTypeId}`)
        .limit(1);

      if (!caseType || caseType.length === 0) {
        throw new Error('Case type not found');
      }

      // Add new field to existing fields array
      const currentFields = caseType[0].fields || [];
      const updatedFields = [...currentFields, fieldName];

      // Update the case type with new fields array
      await db
        .update(caseTypes)
        .set({
          fields: updatedFields
        })
        .where(sql`case_type_id = ${caseTypeId}`);

      return {
        success: true,
        message: 'Field added successfully'
      };
    } catch (error) {
      console.error('Error adding field:', error);
      return {
        success: false,
        error: 'Failed to add field'
      };
    }
  },

  deleteField: async ({ request }) => {
    const formData = await request.formData();
    const caseTypeId = formData.get('case_type_id');
    const fieldToDelete = formData.get('field_name')?.toString();

    if (!fieldToDelete) {
      return {
        success: false,
        error: 'Field name is required'
      };
    }

    try {
      // Get current fields
      const caseType = await db
        .select()
        .from(caseTypes)
        .where(sql`case_type_id = ${caseTypeId}`)
        .limit(1);

      if (!caseType || caseType.length === 0) {
        throw new Error('Case type not found');
      }

      // Filter out the field to delete
      const currentFields = caseType[0].fields || [];
      const updatedFields = currentFields.filter(field => field !== fieldToDelete);

      // Update case type with new fields array
      await db
        .update(caseTypes)
        .set({
          fields: updatedFields
        })
        .where(sql`case_type_id = ${caseTypeId}`);

      return {
        success: true,
        message: 'Field deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting field:', error);
      return {
        success: false,
        error: 'Failed to delete field'
      };
    }
  }
} satisfies Actions;