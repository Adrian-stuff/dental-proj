import { db } from '$lib/server/db';
import { caseTypes, clinics, doctors, records } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { desc, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
  try {
    const record = await db
      .select()
      .from(records)
      .where(sql`record_id = ${params.caseNo}`)
      .limit(1);

    if (!record || record.length === 0) {
      throw error(404, 'Record not found');
    }

    // Fetch additional data needed for dropdowns
    const caseTypesData = await db.select().from(caseTypes);
    const doctorsData = await db
      .select()
      .from(doctors)
      .orderBy(desc(doctors.doctorName));
    const clinicsData = await db
      .select()
      .from(clinics)
      .orderBy(desc(clinics.clinicName));

    return {
      record: record[0],
      caseTypes: caseTypesData,
      doctors: doctorsData.map(doctor => ({
        value: doctor.doctorName,
        label: doctor.doctorName,
        clinicId: doctor.clinicId
      })),
      clinics: clinicsData.map(clinic => ({
        value: clinic.clinicName,
        label: clinic.clinicName,
        clinicId: clinic.clinicId
      }))
    };
  } catch (e) {
    console.error('Error fetching record:', e);
    throw error(500, 'Failed to fetch record');
  }
};

export const actions = {
  update: async ({ request }) => {
    const formData = await request.formData();
    const recordId = formData.get('recordId');

    try {
      await db
        .update(records)
        .set({
          caseType: formData.get('caseType')?.toString(),
          doctorName: formData.get('doctorName')?.toString(),
          clinicName: formData.get('clinicName')?.toString(),
          patientName: formData.get('patientName')?.toString(),
          description: formData.get('description')?.toString(),
          remarks: formData.get('remarks')?.toString(),
          totalAmount: parseFloat(formData.get('totalAmount')?.toString() || '0'),
          paidAmount: parseFloat(formData.get('paidAmount')?.toString() || '0'),
          paymentMethod: formData.get('paymentMethod')?.toString(),
        } as unknown as typeof records.$inferInsert)
        .where(sql`record_id = ${recordId}`);

    } catch (e) {
      console.error('Error updating record:', e);
      return {
        success: false,
        message: 'Failed to update record'
      };
    }
    redirect(303, `/?clinic_name=${formData.get('clinicName')?.toString()}`); // Redirect to the updated record page

  }
};