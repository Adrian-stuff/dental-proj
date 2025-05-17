import { db } from '$lib/server/db';
import { and, eq, sql } from 'drizzle-orm';
import { orders, orderItems, clinics, caseTypes, records, doctors } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const clinicId = url.searchParams.get('clinic') || 'all';

  // Base query for orders with items
  let ordersQuery;

  // Apply clinic filter if selected
  if (clinicId !== 'all') {
    ordersQuery = db
      .select({
        orderId: orders.orderId,
        orderTotal: orders.orderTotal,
        paidAmount: orders.paidAmount,
        doctorId: records.doctorId,
        items: {
          caseTypeId: orderItems.caseTypeId,
          itemQuantity: orderItems.itemQuantity,
          itemCost: orderItems.itemCost
        }
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.orderId, orderItems.orderId))
      .leftJoin(records, eq(orders.orderId, records.orderId))
      .leftJoin(doctors, eq(records.doctorId, doctors.doctorId))
      .where(eq(doctors.clinicId, parseInt(clinicId)));
  } else {
    ordersQuery = db
      .select({
        orderId: orders.orderId,
        orderTotal: orders.orderTotal,
        paidAmount: orders.paidAmount,
        doctorId: records.doctorId,
        items: {
          caseTypeId: orderItems.caseTypeId,
          itemQuantity: orderItems.itemQuantity,
          itemCost: orderItems.itemCost
        }
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.orderId, orderItems.orderId))
      .leftJoin(records, eq(orders.orderId, records.orderId))
      .leftJoin(doctors, eq(records.doctorId, doctors.doctorId));
  }

  const ordersWithItems = await ordersQuery;

  // Get all clinics
  const allClinics = await db.select().from(clinics);

  // Get all case types
  const allCaseTypes = await db.select().from(caseTypes);

  // Calculate summaries
  const summary = {
    totalCases: ordersWithItems.length,
    totalAmount: ordersWithItems.reduce((sum, order) =>
      sum + Number(order.orderTotal || 0), 0),
    paidAmount: ordersWithItems.reduce((sum, order) =>
      sum + Number(order.paidAmount || 0), 0),
    caseTypes: ordersWithItems.reduce((acc, order) => {
      if (order.items) {
        const caseType = allCaseTypes.find(ct => ct.caseTypeId === order.items.caseTypeId);
        if (caseType) {
          acc[caseType.caseTypeName] = (acc[caseType.caseTypeName] || 0) +
            (order.items.itemQuantity || 0);
        }
      }
      return acc;
    }, {} as Record<string, number>)
  };

  return {
    summary,
    clinics: allClinics.map(clinic => ({
      id: clinic.clinicId,
      name: clinic.clinicName
    })),
    selectedClinic: clinicId
  };
};