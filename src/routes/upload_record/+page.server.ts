import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { caseTypes, clinics, doctors, history, records } from '$lib/server/db/schema';
import { desc, sql } from 'drizzle-orm';
import { convertFileToBytea } from '$lib';
import { redirect } from '@sveltejs/kit';
import { Console } from 'console';


export const load: PageServerLoad = async ({ params }) => {
  return {
    caseTypes: (await db.select().from(caseTypes)),
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
    let caseNo;
    try {

      caseNo = (await db.select().from(caseTypes).where(sql`${caseTypes.caseType} = ${data.get('case_type')}`))[0]?.numberOfCases + 1


      const insertedRecord = await db.insert(records)
        .values({
          caseType: data.get('case_type'),
          datePickup: data.get('date'),
          timePickup: data.get('time'),
          caseNo: caseNo,
          doctorName: data.get('doctor_name'),
          clinicName: data.get('clinic_name'),
          patientName: data.get('patient_name'),
          description: data.get('description'),
          totalAmount: data.get('total_amount'),
          paidAmount: data.get('paid_amount'),
          excessPayment: data.get('excess_payment')
        } as typeof records.$inferInsert)
        .returning({ id: records.recordId }); // Assuming 'recordId' is the name of your auto-incrementing primary key

      if (insertedRecord && insertedRecord.length > 0) {
        const newRecordId = insertedRecord[0].id;

        await db.insert(history).values({
          historyType: "in",
          imageData: await convertFileToBytea(data.get('in-img') as File),
          historyDate: data.get('date'),
          recordId: newRecordId,
          historyTime: data.get('time')
        } as unknown as typeof history.$inferInsert);

        await db.update(caseTypes)
          .set({ numberOfCases: caseNo })
          .where(sql`${caseTypes.caseType} = ${data.get('case_type')}`);
      } else {
        // Handle the case where the insertion failed
        console.error("Failed to insert record.");
      }
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
      // return { success: true, message: 'Record inserted successfully' };
    } catch (error) {
      console.error('Error inserting record:', error);
      return { success: false, error: 'Failed to insert record' };
    }
    redirect(303, "/?case_no=" + caseNo + "&case_type=" + data.get('case_type'));


  }
} satisfies Actions;