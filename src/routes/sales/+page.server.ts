import type { Actions, PageServerLoad } from '../$types';
import { db } from '$lib/server/db';
import { clinics, doctors, history, records, supply, orders, orderItems } from '$lib/server/db/schema';
import { desc, sql } from 'drizzle-orm';
import { convertFileToBytea } from '$lib';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
// // dev-only mocks
// let devMocks: typeof import('$lib/mock/sales') | null = null;
// if (import.meta.env && import.meta.env.DEV) {
//   // dynamic import to avoid bundling mocks into production
//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   devMocks = await import('$lib/mock/sales');
// }

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
  const status = searchParams.get('status');
  const exactDate = searchParams.get('date');
  const remarks = searchParams.get('remarks');
  const clinicId = searchParams.get('clinic_id');
  // if (import.meta.env && import.meta.env.DEV && devMocks) {
  //   // Use mock data in development
  //   const recordData = devMocks.getMockRecords({ status, exactDate, remarks });
  //   const supplies = devMocks.getMockSupplies({ exactDate });

  //   const date = exactDate ? new Date(exactDate) : new Date();
  //   return {
  //     currentDate: exactDate,
  //     currentMonth: date.getMonth() + 1,
  //     currentYear: date.getFullYear(),
  //     recordData,
  //     supplies
  //   };
  // }

  if (exactDate) {
    const date = new Date(exactDate);
    // Query for exact date with proper joins
    const recordData = await db
      .select({
        record: records,
        order: orders,
        clinicName: clinics.clinicName,
        items: sql<Array<typeof orderItems>>`json_agg(${orderItems})`,
        balance: sql<number>`(${orders.orderTotal} - COALESCE(${orders.paidAmount}, 0))`
      })
      .from(records)
      .innerJoin(orders, eq(records.orderId, orders.orderId))
      .innerJoin(orderItems, eq(orders.orderId, orderItems.orderId))
      .innerJoin(doctors, eq(records.doctorId, doctors.doctorId))
      .innerJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
      .where(
        status || remarks || clinicId
          ? sql`DATE(records.date_dropoff) = ${exactDate} AND (${status ? sql`${orders.paymentStatus} = ${status}` : sql`TRUE`}) AND (${remarks ? sql`${records.remarks} = ${remarks}` : sql`TRUE`}) AND (${clinicId ? sql`${clinics.clinicId} = ${parseInt(clinicId)}` : sql`TRUE`})`
          : sql`DATE(records.date_dropoff) = ${exactDate}`
      )
      .groupBy(records.recordId, orders.orderId, doctors.doctorId, clinics.clinicId);

    const supplies = await db
      .select()
      .from(supply)
      .where(sql`DATE(supply_date) = ${exactDate}`);

    // Get all clinics for the filter dropdown
    const allClinics = await db
      .select({
        clinicId: clinics.clinicId,
        clinicName: clinics.clinicName
      })
      .from(clinics)
      .orderBy(clinics.clinicName);

    return {
      currentDate: exactDate,
      currentMonth: date.getMonth() + 1,
      currentYear: date.getFullYear(),
      recordData,
      supplies,
      clinics: allClinics
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
      .select({
        record: records,
        order: orders,
        clinicName: clinics.clinicName,
        items: sql<Array<typeof orderItems>>`json_agg(${orderItems})`,
        balance: sql<number>`(${orders.orderTotal} - COALESCE(${orders.paidAmount}, 0))`
      })
      .from(records)
      .innerJoin(orders, eq(records.orderId, orders.orderId))
      .innerJoin(orderItems, eq(orders.orderId, orderItems.orderId))
      .innerJoin(doctors, eq(records.doctorId, doctors.doctorId))
      .innerJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
      .where(
        status || remarks || clinicId
          ? sql`records.date_dropoff IS NOT NULL AND records.date_dropoff BETWEEN ${formatDate(startDate)} AND ${formatDate(endDate)} AND (${status ? sql`${orders.paymentStatus} = ${status}` : sql`TRUE`}) AND (${remarks ? sql`${records.remarks} = ${remarks}` : sql`TRUE`}) AND (${clinicId ? sql`${clinics.clinicId} = ${parseInt(clinicId)}` : sql`TRUE`})`
          : sql`records.date_dropoff IS NOT NULL AND records.date_dropoff BETWEEN ${formatDate(startDate)} AND ${formatDate(endDate)}`
      )
      .groupBy(records.recordId, orders.orderId, doctors.doctorId, clinics.clinicId);
    // .where(sql`records.date_dropoff IS NOT NULL AND records.date_dropoff BETWEEN ${formatDate(startDate)} AND ${formatDate(endDate)}`)
    // .where(status ? sql`(${orders.paymentStatus} = ${status})` : sql`TRUE`)
    // .groupBy(records.recordId, orders.orderId, doctors.doctorId, clinics.clinicId);

    const supplies = await db
      .select()
      .from(supply)
      .where(sql`supply_date BETWEEN ${formatDate(startDate)} AND ${formatDate(endDate)}`);

    // Get all clinics for the filter dropdown
    const allClinics = await db
      .select({
        clinicId: clinics.clinicId,
        clinicName: clinics.clinicName
      })
      .from(clinics)
      .orderBy(clinics.clinicName);

    return {
      currentMonth: selectedMonth,
      currentYear: selectedYear,
      recordData,
      supplies,
      clinics: allClinics,
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