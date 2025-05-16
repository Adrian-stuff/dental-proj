import { db } from '$lib/server/db';
import { caseTypes, clinics, doctors, records } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { desc, eq, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
  try {
    const recordData = await db
      .select({
        recordId: records.recordId,
        datePickup: records.datePickup,
        timePickup: records.timePickup,
        dateDropoff: records.dateDropoff,
        timeDropoff: records.timeDropoff,
        doctorId: records.doctorId,
        patientName: records.patientName,
        description: records.description,
        remarks: records.remarks,
        doctorName: doctors.doctorName,
        clinicId: doctors.clinicId,
        clinicName: clinics.clinicName
      })
      .from(records)
      .leftJoin(doctors, eq(records.doctorId, doctors.doctorId))
      .leftJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
      .where(sql`${records.recordId} = ${params.caseNo}`)
      .limit(1);

    if (!recordData || recordData.length === 0) {
      throw error(404, 'Record not found');
    }

    const doctorsData = await db
      .select()
      .from(doctors)


    const clinicsData = await db
      .select()
      .from(clinics)
      .orderBy(desc(clinics.clinicName));

    return {
      record: recordData[0],
      doctors: doctorsData,
      clinics: clinicsData
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
    const doctorId = parseInt(formData.get('doctorId')?.toString() || '0');
    console.log(formData)
    try {
      await db
        .update(records)
        .set({
          doctorId,
          patientName: formData.get('patientName')?.toString(),
        })
        .where(sql`record_id = ${recordId}`);

      return {
        success: true,
        message: 'Record updated successfully'
      };
    } catch (e) {
      console.error('Error updating record:', e);
      return {
        success: false,
        message: 'Failed to update record'
      };
    }
  }
};