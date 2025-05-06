import { db } from '$lib/server/db';
import { clinics, doctors, records } from '$lib/server/db/schema';
import { desc, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
  const caseNo = url.searchParams.get('case_no')?.toString();
  const clinicName = url.searchParams.get('clinic_name')?.toString();
  let doctorData = (await db.select().from(doctors).orderBy(desc(doctors.doctorName))).map(
    (doctor) => ({
      value: doctor.doctorName,
      label: doctor.doctorName
    })
  );

  let clinicData = (await db.select().from(clinics).orderBy(desc(clinics.clinicName))).map(
    (clinic) => ({
      value: clinic.clinicName,
      label: clinic.clinicName
    })
  );

  if (caseNo) {
    let recordData = await db
      .select()
      .from(records)
      .where(sql`case_no = ${caseNo}`)
      .orderBy(desc(records.recordId));
    return {
      data: recordData,
      clinicName: recordData[0]?.clinicName,
      caseNo: caseNo,
      doctors: doctorData,
      clinics: clinicData,
      hasQuery: true
    };
  } else if (clinicName) {
    let recordData = await db
      .select()
      .from(records)
      .where(sql`clinic_name = ${clinicName}`)
      .orderBy(desc(records.recordId));
    return {
      data: recordData,
      clinicName: clinicName,
      caseNo: null,
      doctors: doctorData,
      clinics: clinicData,
      hasQuery: true

    };
  } else {
    let recordData = await db.select().from(records).orderBy(desc(records.recordId));
    return {
      data: recordData,
      clinicName: null,
      caseNo: null,
      doctors: doctorData,
      clinics: clinicData,
      hasQuery: false

    };
  }
};

export const actions: Actions = {
  caseNo: async ({ request }) => {
    const data = await request.formData();


    const caseNo = data.get('case_no')?.toString();
    let recordData = await db
      .select()
      .from(records)
      .where(sql`case_no = ${caseNo}`);
    return { success: true, data: recordData, clinicName: recordData[0]?.clinicName };
  },
  clinics: async ({ request }) => {
    const data = await request.formData();

    const clinicName = data.get('clinic_name')?.toString();

    return {
      success: true,
      data: await db
        .select()
        .from(records)
        .where(sql`clinic_name = ${clinicName}`)
        .orderBy(desc(records.recordId)),
      clinicName: clinicName
    };
  },
  date: async ({ request }) => {
    const data = await request.formData();

    const start_date = data.get('start_date')?.toString();
    const end_date = data.get('end_date')?.toString();

    let recordData = await db
      .select()
      .from(records)
      .where(sql`date_pickup BETWEEN ${start_date} AND ${end_date}`)
      .orderBy(desc(records.datePickup));
    return { success: true, data: recordData, start_date: start_date, end_date: end_date };
  }
} satisfies Actions;
