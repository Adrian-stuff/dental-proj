import { db } from '$lib/server/db';
import { clinics, doctors, records } from '$lib/server/db/schema';
import { desc, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  return {
    data: await db.select().from(records).orderBy(desc(records.recordId)),
    doctors: (await db.select()
      .from(doctors)
      .orderBy(desc(doctors.doctorName))
    ).map((doctor) => ({
      value: doctor.doctorName,
      label: doctor.doctorName
    })),

    clinics: (await db.select()
      .from(clinics)
      .orderBy(desc(clinics.clinicName))
    ).map((clinic) => ({
      value: clinic.clinicName,
      label: clinic.clinicName
    })),
  }
};


export const actions: Actions = {
  caseNo: async ({ request }) => {
    const data = await request.formData();

    const caseNo = data.get('case_no')?.toString();
    let recordData = await db.select().from(records).where(sql`case_no = ${caseNo}`);
    return { success: true, data: recordData, clinicName: recordData[0]?.clinicName };
  },
  clinics: async ({ request }) => {
    const data = await request.formData();

    const clinicName = data.get('clinic_name')?.toString();

    return { success: true, data: await db.select().from(records).where(sql`clinic_name = ${clinicName}`), clinicName: clinicName };
  },
  date: async ({ request }) => {
    const data = await request.formData();

    const start_date = data.get('start_date')?.toString();
    const end_date = data.get('end_date')?.toString();

    let recordData = await db.select().from(records).where(sql`date_pickup BETWEEN ${start_date} AND ${end_date}`);
    return { success: true, data: recordData, start_date: start_date, end_date: end_date };
  }
} satisfies Actions;
