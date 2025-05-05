import type { Actions, PageServerLoad } from '../../$types';
import { db } from '$lib/server/db';
import { clinics, doctors, history, records } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import { convertFileToBytea } from '$lib';


export const load: PageServerLoad = async ({ params }) => {
  const caseNo = params.caseNo.toString();

  return {
    caseNo,
  };
};

export const actions = {
  default: async ({ cookies, request }) => {
    const data = await request.formData();
    console.log('Form data:', data);

    try {
      await db.insert(history).values({
        historyType: "in",
        recordId: data.get('case_no')?.toString(),
        imageData: await convertFileToBytea(data.get('in-img') as File),
        historyDate: data.get("date"),
        historyTime: data.get("time"),
      } as unknown as typeof history.$inferInsert);
      return { success: true, message: 'Record inserted successfully' };
    } catch (error) {
      console.error('Error inserting record:', error);
      return { success: false, error: 'Failed to insert record' };
    }


  }
} satisfies Actions;