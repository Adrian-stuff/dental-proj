import type { Actions, PageServerLoad } from '../$types';
import { db } from '$lib/server/db';
import { clinics, doctors, history, records, supply } from '$lib/server/db/schema';
import { desc, sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const load: PageServerLoad = async ({ url }) => {
  // Get the month and year from URL params or use current date
  const searchParams = url.searchParams;
  const currentDate = new Date();
  const selectedYear = parseInt(searchParams.get('year') || currentDate.getFullYear().toString());
  const selectedMonth = parseInt(searchParams.get('month') || (currentDate.getMonth() + 1).toString());

  // Get the first and last day of the selected month
  const startDate = new Date(selectedYear, selectedMonth - 1, 1);
  const endDate = new Date(selectedYear, selectedMonth, 0);

  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  const recordData = await db
    .select()
    .from(supply)
    .where(sql`"supply_date" BETWEEN ${formattedStartDate} AND ${formattedEndDate}`);

  return {
    currentMonth: selectedMonth,
    currentYear: selectedYear,
    recordData,
  };
};

export const actions = {
  add: async ({ request }) => {
    const data = await request.formData();
    const supplyDate = data.get('supply_date');
    const supplyCost = data.get('supply_cost');
    const description = data.get('description');

    try {
      await db.insert(supply).values({
        supplyDate,
        supplyCost,
        description,
        // ...other fields...
      });

      return {
        success: true,
        message: 'Expense added successfully',
      };
    } catch (error) {
      console.error('Error adding expense:', error);
      return {
        success: false,
        error: 'Failed to add expense',
      };
    }
  },

  changeMonth: async ({ request }) => {
    const data = await request.formData();
    const month = data.get('month');
    const year = data.get('year');

    // Redirect to the same page with new query parameters
    throw redirect(303, `?month=${month}&year=${year}`);
  },
} satisfies Actions;