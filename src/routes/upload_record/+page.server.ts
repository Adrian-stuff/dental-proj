import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { clinics, doctors, history, records } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import { convertFileToBytea } from '$lib';


export const load: PageServerLoad = async ({ params }) => {
  return {
    caseNo: (await db.select()
      .from(records)
      .orderBy(desc(records.caseNo)) // Replace 'id' with your primary key or a suitable ordering column
      .limit(1))[0]?.caseNo + 1,
    caseTypes: [
      { value: 'OR', label: 'OR' },
      { value: 'F', label: 'F' },
      { value: 'TH', label: 'TH' },
      { value: 'IVO', label: 'IVO' },
      { value: 'R', label: 'R' },
      { value: 'P', label: 'P' },
      { value: 'TIL', label: 'TIL' },
      { value: 'Z', label: 'Z' },
      { value: 'TC', label: 'TC' },
      { value: 'R', label: 'R' },
      { value: 'BJ', label: 'BJ' },
    ],
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
  };
};

export const actions = {
  default: async ({ cookies, request }) => {
    const data = await request.formData();
    console.log('Form data:', data);
    try {
      await db.insert(records).values({
        caseType: data.get('case_type'),
        datePickup: data.get('date'),
        timePickup: data.get('time'),
        doctorName: data.get('doctor_name'),
        clinicName: data.get('clinic_name'),
        patientName: data.get('patient_name'),
        description: data.get('description'),
        totalAmount: data.get('total_amount'),
        paidAmount: data.get('paid_amount'),
        excessPayment: data.get('excess_payment')
      } as typeof records.$inferInsert);

      await db.insert(history).values({
        historyType: "in",
        imageData: await convertFileToBytea(data.get('in-img') as File),
        historyDate: data.get('date'),
        recordId: (await db.select()
          .from(records)
          .orderBy(desc(records.caseNo)) // Replace 'id' with your primary key or a suitable ordering column
          .limit(1))[0]?.caseNo,
        historyTime: data.get('time')
      } as unknown as typeof history.$inferInsert);

      // await db.insert(history).values({
      //   historyType: "out",
      //   imageData: await convertFileToBytea(data.get('out-img') as File),
      //   historyDate: data.get('date'),
      //   recordId: (await db.select()
      //     .from(records)
      //     .orderBy(desc(records.caseNo)) // Replace 'id' with your primary key or a suitable ordering column
      //     .limit(1))[0]?.caseNo,
      //   historyTime: data.get('time')
      // } as unknown as typeof history.$inferInsert);

    } catch (error) {
      console.error('Error inserting record:', error);
      return { success: false, error: 'Failed to insert record' };
    }


  }
} satisfies Actions;