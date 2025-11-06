import { db } from '$lib/server/db';
import { clinics, doctors, records, orders } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  try {
    // Aggregate totals per clinic by joining clinics -> doctors -> records -> orders
    const balances = await db
      .select({
        clinicId: clinics.clinicId,
        clinicName: clinics.clinicName,
        totalOrders: sql`coalesce(sum(${orders.orderTotal}), 0)`,
        totalPaid: sql`coalesce(sum(${orders.paidAmount}), 0)`,
  // balance: paid - orders so positive means clinic has credit (overpaid)
  balance: sql`coalesce(sum(${orders.paidAmount}), 0) - coalesce(sum(${orders.orderTotal}), 0)`
      })
      .from(clinics)
      .leftJoin(doctors, sql`${doctors.clinicId} = ${clinics.clinicId}`)
      .leftJoin(records, sql`${records.doctorId} = ${doctors.doctorId}`)
      .leftJoin(orders, sql`${orders.orderId} = ${records.orderId}`)
      .groupBy(clinics.clinicId)
      .orderBy(clinics.clinicName);

    return { balances };
  } catch (e) {
    console.error('Error loading balances:', e);
    return { balances: [] };
  }
};
