import { db } from '$lib/server/db';
import { clinics, doctors, orders, payments, records } from '$lib/server/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type Entry = {
  key: string;
  date: string;
  type: 'charge' | 'payment';
  recordId: number;
  patientName: string;
  doctorName: string | null;
  paymentMethod: string | null;
  amount: number;
};

export const load: PageServerLoad = async ({ params, url }) => {
  const clinicId = parseInt(params.clinic);
  if (isNaN(clinicId)) error(404, 'Clinic not found');

  const [clinic] = await db.select().from(clinics).where(eq(clinics.clinicId, clinicId));
  if (!clinic) error(404, 'Clinic not found');

  const from = url.searchParams.get('from') || '';
  const to = url.searchParams.get('to') || '';

  // Only finished orders are billed, same as the balances page
  const clinicFinished = and(eq(doctors.clinicId, clinicId), eq(records.remarks, 'finished'));

  const [charges, paid] = await Promise.all([
    db
      .select({
        recordId: records.recordId,
        date: sql<string>`coalesce(${records.dateDropoff}, ${orders.orderDate})::text`,
        patientName: records.patientName,
        doctorName: doctors.doctorName,
        amount: orders.orderTotal
      })
      .from(records)
      .innerJoin(orders, eq(orders.orderId, records.orderId))
      .innerJoin(doctors, eq(doctors.doctorId, records.doctorId))
      .where(clinicFinished),
    db
      .select({
        paymentId: payments.paymentId,
        recordId: records.recordId,
        date: payments.paymentDate,
        patientName: records.patientName,
        doctorName: doctors.doctorName,
        paymentMethod: payments.paymentMethod,
        amount: payments.amount
      })
      .from(payments)
      .innerJoin(records, eq(records.orderId, payments.orderId))
      .innerJoin(doctors, eq(doctors.doctorId, records.doctorId))
      .where(clinicFinished)
  ]);

  const all: Entry[] = [
    ...charges.map((c) => ({
      key: `charge-${c.recordId}`,
      date: c.date,
      type: 'charge' as const,
      recordId: c.recordId,
      patientName: c.patientName,
      doctorName: c.doctorName,
      paymentMethod: null,
      amount: Number(c.amount) || 0
    })),
    ...paid.map((p) => ({
      key: `payment-${p.paymentId}`,
      date: p.date,
      type: 'payment' as const,
      recordId: p.recordId,
      patientName: p.patientName,
      doctorName: p.doctorName,
      paymentMethod: p.paymentMethod,
      amount: Number(p.amount) || 0
    }))
  ].sort(
    (a, b) => a.date.localeCompare(b.date) || a.recordId - b.recordId || a.type.localeCompare(b.type)
  );

  // Amount still owed from before the selected period
  const openingBalance = all
    .filter((e) => from && e.date < from)
    .reduce((sum, e) => sum + (e.type === 'charge' ? e.amount : -e.amount), 0);

  return {
    clinic,
    from,
    to,
    openingBalance,
    entries: all.filter((e) => (!from || e.date >= from) && (!to || e.date <= to))
  };
};
