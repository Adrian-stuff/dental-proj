import type { Actions, PageServerLoad } from '../$types';
import { db } from '$lib/server/db';
import { clinics, doctors, history, records, supply } from '$lib/server/db/schema';
import { desc, sql } from 'drizzle-orm';
import { convertFileToBytea } from '$lib';
import { redirect } from '@sveltejs/kit';

// Function to format a Date object into the desired string format
const timestampDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  const offset = '+08'; // Assuming the timezone is +08

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}${offset}`;
};
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');


  return `${year}-${month}-${day}`;
};
export const load: PageServerLoad = async ({ url }) => {
  const searchParams = url.searchParams;
  const currentDate = new Date();
  
  // Get month and year from URL params or use current date
  const selectedYear = parseInt(searchParams.get('year') || currentDate.getFullYear().toString());
  const selectedMonth = parseInt(searchParams.get('month') || (currentDate.getMonth() + 1).toString());

  // Get the first and last day of the selected month
  const startDate = new Date(selectedYear, selectedMonth - 1, 1);
  const endDate = new Date(selectedYear, selectedMonth, 0);

  const recordData = await db
    .select()
    .from(records)
    .where(sql`"created_at" BETWEEN ${timestampDate(startDate)} AND ${timestampDate(endDate)}`);

  const supplies = await db
    .select()
    .from(supply)
    .where(sql`"supply_date" BETWEEN ${formatDate(startDate)} AND ${formatDate(endDate)}`);

  return {
    currentMonth: selectedMonth,
    currentYear: selectedYear,
    recordData,
    supplies,
  };
};

export const actions = {
  changeDate: async ({ request }) => {
    const data = await request.formData();
    const month = data.get('month');
    const year = data.get('year');
    
    // Redirect to the same page with new month/year parameters
    throw redirect(303, `?month=${month}&year=${year}`);
  }
} satisfies Actions;