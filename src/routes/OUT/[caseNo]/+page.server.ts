import type { Actions, PageServerLoad } from '../../$types';
import { db } from '$lib/server/db';
import { clinics, doctors, history, records } from '$lib/server/db/schema';
import { desc, sql } from 'drizzle-orm';
import { convertFileToBytea } from '$lib';
import { redirect } from '@sveltejs/kit';


export const load: PageServerLoad = async ({ params }) => {
  const caseNo = params.caseNo.toString();
  let recordData = await db.select().from(records).where(sql`record_id = ${caseNo}`);
  return {
    caseNo,
    recordData: recordData[0],
  };
};

export const actions = {
  default: async ({ cookies, request }) => {
    const data = await request.formData();
    console.log('Form data:', data);

    try {
      await db.update(records).set({
        dateDropoff: data.get("date"),
        timeDropoff: data.get("time"),
        remarks: data.get("finished") ? "finished" : "pending",
      } as unknown as typeof records.$inferInsert).where(sql`case_no = ${data.get('case_no')?.toString()}`);
      await db.insert(history).values({
        historyType: "out",
        recordId: data.get('case_no')?.toString(),
        imageData: await convertFileToBytea(data.get('out-img') as File),
        historyDate: data.get("date"),
        historyTime: data.get("time"),
      } as unknown as typeof history.$inferInsert);
      // return { success: true, message: 'Record inserted successfully' };
    } catch (error) {
      console.error('Error inserting record:', error);
      return { success: false, error: 'Failed to insert record' };
    }

    redirect(303, `/history/${data.get('case_no')?.toString()}`); // Redirect to the desired page after successful insertion

  }
} satisfies Actions;