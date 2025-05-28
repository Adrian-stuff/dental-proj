
import { eq } from 'drizzle-orm';
import { records, orders, orderItems, doctors, clinics, caseTypes } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const load = (async ({ params }) => {
  const { caseNo } = params;

  try {
    const result = await db
      .select({
        recordId: records.recordId,
        datePickup: records.datePickup,
        dateDropoff: records.dateDropoff,
        timePickup: records.timePickup,
        timeDropoff: records.timeDropoff,
        patientName: records.patientName,
        remarks: records.remarks,
        orderTotal: orders.orderTotal,
        paidAmount: orders.paidAmount,
        paymentStatus: orders.paymentStatus,
        clinicName: clinics.clinicName,
        doctorName: doctors.doctorName,
        orderItems: orderItems,
        caseTypeName: caseTypes.caseTypeName
      })
      .from(records)
      .innerJoin(orders, eq(records.orderId, orders.orderId))
      .innerJoin(doctors, eq(records.doctorId, doctors.doctorId))
      .innerJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
      .innerJoin(orderItems, eq(orders.orderId, orderItems.orderId))
      .innerJoin(caseTypes, eq(orderItems.caseTypeId, caseTypes.caseTypeId))
      .where(eq(records.recordId, parseInt(caseNo)));

    if (!result[0]) {
      throw error(404, 'Invoice not found');
    }

    const invoice = {
      date: result[0].dateDropoff,
      clinic_name: result[0].clinicName,
      patient_name: result[0].patientName,
      doctor_name: result[0].doctorName,
      total_amount: result[0].orderTotal,
      record_id: result[0].recordId,
      withholding_tax: 0, // Add if you have this in your schema
      items: result.map(item => ({
        quantity: item.orderItems.itemQuantity,
        unit: item.orderItems.upOrDown,
        description: `${item.caseTypeName} - ${item.orderItems.orderDescription || ''}`,
        unit_cost: item.orderItems.itemCost,
        amount: Number(item.orderItems.itemCost) * Number(item.orderItems.itemQuantity),
        case_no: `${item.caseTypeName} - ${item.orderItems.caseNo}`
      })),
      remarks: result[0].remarks,
      payment_status: result[0].paymentStatus
    };
    console.log(invoice)
    return {
      invoice
    };
  } catch (err) {
    console.error('Database error:', err);
    throw error(500, 'Failed to load invoice data');
  }
}) satisfies PageServerLoad;