import { db } from '$lib/server/db';
import { clinics, doctors, history, records } from '$lib/server/db/schema';
import { desc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {

  console.log(params.caseNo.toString(), 'params.caseNo');
  const caseNo = String(params.caseNo.toString());
  let data = [];
  let recordData = [];
  try {

    data = await db.select().from(history).where(sql`record_id = ${caseNo}`).orderBy(desc(history.historyId))
    recordData = await db.select().from(records).where(sql`case_no = ${caseNo}`).orderBy(desc(records.recordId)).limit(1)
    console.log(recordData)
  } catch (error) {
    console.error('Error:', error);

  }
  return {
    data,
    recordData: recordData,
    caseNo,

  }
};


