import type { Actions, PageServerLoad } from '../../$types';
import { db } from '$lib/server/db';
import { clinics, doctors, history, records } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { convertFileToBytea } from '$lib';
import { redirect } from '@sveltejs/kit';


export const load: PageServerLoad = async ({ params }) => {
  const caseNo = params.caseNo.toString();
  let recordData = [];
  try {
    recordData = await db.select().from(records).where(sql`case_no = ${caseNo}`).orderBy(desc(records.recordId)).limit(1)
    console.log(recordData)
  } catch (error) {
    console.error('Error:', error);
  }
  return {
    caseNo,
    recordData: recordData[0],
  };
};

export const actions = {
  default: async ({ cookies, request, params }) => {
    const data = await request.formData();
    console.log('Form data:', data);
    const caseNo = params.caseNo.toString();
    try {
      await db.update(records).set({ totalAmount: data.get("total_amount"), paidAmount: data.get("paid_amount"), excessPayment: data.get("excess_payment") } as unknown as typeof records.$inferInsert).where(eq(records.caseNo, caseNo));

      // return { success: true, message: 'Record inserted successfully' };
    } catch (error) {
      console.error('Error inserting record:', error);
      return { success: false, error: 'Failed to insert record' };
    }
    redirect(303, `/?case_no=${caseNo}&case_type=${data.get("case_type")}`);

  }
} satisfies Actions;