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
  const exactDate = searchParams.get('date');
  
  if (exactDate) {
      const date = new Date(exactDate);
      // Query for exact date
      const recordData = await db
          .select()
          .from(records)
          .where(sql`DATE(created_at) = ${exactDate}`);

      const supplies = await db
          .select()
          .from(supply)
          .where(sql`DATE(supply_date) = ${exactDate}`);

      return {
          currentDate: exactDate,
          currentMonth: date.getMonth() + 1,
          currentYear: date.getFullYear(),
          recordData,
          supplies
      };
  } else {
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
  }
};

export const actions = {
  changeDate: async ({ request }) => {
    const data = await request.formData();
    const exactDate = data.get('exact_date');
    
    if (exactDate) {
        // Handle exact date query
        const date = new Date(exactDate as string);
        return redirect(303, `?date=${exactDate}`);
    } else {
        // Handle month/year query
        const month = data.get('month');
        const year = data.get('year');
        return redirect(303, `?month=${month}&year=${year}`);
    }
  }
} satisfies Actions;