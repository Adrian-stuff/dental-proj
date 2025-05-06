import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { clinics, doctors, history, records } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import { convertFileToBytea } from '$lib';
import { redirect } from '@sveltejs/kit';


export const load: PageServerLoad = async ({ params }) => {
  return {


    doctors: (await db.select()
      .from(doctors)
      .orderBy(desc(doctors.doctorName))
    ).map((doctor) => ({
      value: doctor.doctorName,
      label: doctor.doctorName,
      clinicId: doctor.clinicId
    })),

    clinics: (await db.select()
      .from(clinics)
      .orderBy(desc(clinics.clinicName))
    ).map((clinic) => ({
      value: clinic.clinicName,
      label: clinic.clinicName,
      clinicId: clinic.clinicId
    })),
  };
};

export const actions = {
  default: async ({ cookies, request }) => {
    const data = await request.formData();
    console.log('Form data:', data);
    let caseNo
    try {

    } catch (error) {
      console.error('Error inserting record:', error);
      return { success: false, error: 'Failed to insert record' };
    }



  }
} satisfies Actions;