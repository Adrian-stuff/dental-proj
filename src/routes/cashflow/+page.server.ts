import { db } from '$lib/server/db';
import { clinics, doctors, payments, records, supply } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const load: PageServerLoad = async ({ url }) => {
  const searchParams = url.searchParams;
  const currentDate = new Date();
  const selectedYear = parseInt(searchParams.get('year') || currentDate.getFullYear().toString());
  const selectedMonth = parseInt(searchParams.get('month') || (currentDate.getMonth() + 1).toString());

  const startDate = formatDate(new Date(selectedYear, selectedMonth - 1, 1));
  const endDate = formatDate(new Date(selectedYear, selectedMonth, 0));

  try {
    const [moneyIn, moneyOut, [openingIn], [openingOut]] = await Promise.all([
      db
        .select({
          paymentId: payments.paymentId,
          paymentDate: payments.paymentDate,
          amount: payments.amount,
          paymentMethod: payments.paymentMethod,
          recordId: records.recordId,
          patientName: records.patientName,
          doctorName: doctors.doctorName,
          clinicName: clinics.clinicName
        })
        .from(payments)
        .leftJoin(records, eq(records.orderId, payments.orderId))
        .leftJoin(doctors, eq(doctors.doctorId, records.doctorId))
        .leftJoin(clinics, eq(clinics.clinicId, doctors.clinicId))
        .where(sql`${payments.paymentDate} BETWEEN ${startDate} AND ${endDate}`)
        .orderBy(payments.paymentDate, payments.paymentId),
      db
        .select()
        .from(supply)
        .where(sql`${supply.supplyDate} BETWEEN ${startDate} AND ${endDate}`)
        .orderBy(supply.supplyDate, supply.supplyId),
      // Everything before the selected month, for the opening balance
      db
        .select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` })
        .from(payments)
        .where(sql`${payments.paymentDate} < ${startDate}`),
      db
        .select({ total: sql<string>`coalesce(sum(${supply.supplyCost}), 0)` })
        .from(supply)
        .where(sql`${supply.supplyDate} < ${startDate}`)
    ]);

    return {
      currentMonth: selectedMonth,
      currentYear: selectedYear,
      moneyIn,
      moneyOut,
      openingBalance: Number(openingIn.total) - Number(openingOut.total)
    };
  } catch (e) {
    console.error('Error loading money history:', e);
    return {
      currentMonth: selectedMonth,
      currentYear: selectedYear,
      moneyIn: [],
      moneyOut: [],
      openingBalance: 0,
      error: 'Failed to load money history'
    };
  }
};
