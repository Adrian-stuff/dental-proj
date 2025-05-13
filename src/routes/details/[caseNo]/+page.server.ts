import { db } from '$lib/server/db';
import { records, history } from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { sql, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
  try {
    // Get the record details
    const record = await db
      .select()
      .from(records)
      .where(sql`record_id = ${params.caseNo}`)
      .limit(1);

    if (!record || record.length === 0) {
      throw error(404, 'Case not found');
    }

    // Get the history for this case
    const caseHistory = await db
      .select()
      .from(history)
      .where(sql`record_id = ${params.caseNo}`)
      .orderBy(desc(history.historyDate));

    return {
      record: record[0],
      history: caseHistory
    };
  } catch (e) {
    console.error('Error fetching case details:', e);
    throw error(500, 'Failed to fetch case details');
  }
};