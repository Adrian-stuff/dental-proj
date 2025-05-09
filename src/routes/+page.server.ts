import { db } from '$lib/server/db';
import { caseTypes, clinics, doctors, history, records } from '$lib/server/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
  const caseNo = url.searchParams.get('case_no')?.toString();
  const caseType = url.searchParams.get('case_type')?.toString();
  const clinicName = url.searchParams.get('clinic_name')?.toString();
  let doctorData = (await db.select().from(doctors).orderBy(desc(doctors.doctorName))).map(
    (doctor) => ({
      value: doctor.doctorName,
      label: doctor.doctorName
    })
  );

  let clinicData = (await db.select().from(clinics).orderBy(desc(clinics.clinicName))).map(
    (clinic) => ({
      value: clinic.clinicName,
      label: clinic.clinicName
    })
  );
  let caseTypeData = (await db.select().from(caseTypes));

  try {
    if (caseNo && caseType) {
      let recordData = await db
        .select()
        .from(records)
        .where(sql`case_no = ${caseNo} AND case_type = ${caseType}`)
        .orderBy(desc(records.recordId));
      return {
        data: recordData.length <= 0 ? [] : recordData,
        clinicName: recordData[0]?.clinicName,
        caseTypes: caseTypeData,
        caseNo: caseNo,
        caseType: caseType,
        doctors: doctorData,
        clinics: clinicData,
        hasQuery: true
      };
    } else if (!caseNo && caseType) {
      let recordData = await db
        .select()
        .from(records)
        .where(sql`case_type = ${caseType}`)
        .orderBy(desc(records.recordId));
      return {
        data: recordData.length <= 0 ? [] : recordData,
        clinicName: recordData[0]?.clinicName,
        caseTypes: caseTypeData,
        caseNo: null,
        caseType: caseType,
        doctors: doctorData,
        clinics: clinicData,
        hasQuery: true
      };
    }
    else if (clinicName) {
      let recordData = await db
        .select()
        .from(records)
        .where(sql`clinic_name = ${clinicName}`)
        .orderBy(desc(records.recordId));
      return {
        data: recordData.length <= 0 ? [] : recordData,
        clinicName: clinicName,
        caseTypes: caseTypeData,
        caseType: null,
        caseNo: null,
        doctors: doctorData,
        clinics: clinicData,
        hasQuery: true

      };
    } else {
      let recordData = await db.select().from(records).orderBy(desc(records.recordId));
      return {
        data: recordData.length <= 0 ? [] : recordData,
        clinicName: null,
        caseTypes: caseTypeData,
        caseType: null,
        caseNo: null,
        doctors: doctorData,
        clinics: clinicData,
        hasQuery: false

      };
    }
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'Failed to fetch record data' };
  }
};


export const actions: Actions = {
  caseNo: async ({ request }) => {
    const data = await request.formData();
    const caseNo = data.get('case_no')?.toString();
    const caseType = data.get('case_type')?.toString();
    const clinicName = data.get('clinic_name')?.toString();
    const start_date = data.get('start_date')?.toString();
    const end_date = data.get('end_date')?.toString();
    const remark = data.get('remark')?.toString();

    let whereConditions = [];

    if (caseNo) {
      whereConditions.push(sql`case_no = ${caseNo}`);
    }
    if (caseType) {
      whereConditions.push(sql`case_type = ${caseType}`);
    }
    if (clinicName) {
      whereConditions.push(sql`clinic_name = ${clinicName}`);
    }
    if (start_date && end_date) {
      whereConditions.push(sql`date_pickup BETWEEN ${start_date} AND ${end_date}`);
    }
    if (remark) {
      whereConditions.push(sql`remarks = ${remark}`);
    }

    let recordData;
    try {
      if (whereConditions.length > 0) {
        // Use 'and' to combine multiple conditions
        recordData = await db
          .select()
          .from(records)
          .where(and(...whereConditions)) // Combine conditions
          .orderBy(desc(records.datePickup)); // Added order by
      } else {
        recordData = await db.select().from(records).orderBy(desc(records.datePickup));
      }


    } catch (error) {
      console.error("Database query error:", error);
      return { success: false, error: "Failed to retrieve data" };
    }
    return { success: true, data: recordData, clinicName: recordData[0]?.clinicName, start_date, end_date, remark };
  },
  clinics: async ({ request }) => {
    const data = await request.formData();
    const clinicName = data.get('clinic_name')?.toString();

    let recordData;
    try {
      if (clinicName) {
        recordData = await db
          .select()
          .from(records)
          .where(sql`clinic_name = ${clinicName}`)
          .orderBy(desc(records.recordId));
      }
      else {
        recordData = await db.select().from(records).orderBy(desc(records.recordId));
      }
    } catch (error) {
      console.error("Database query error:", error);
      return { success: false, error: "Failed to retrieve data" };
    }
    return {
      success: true,
      data: recordData,
      clinicName: clinicName
    };
  },
  date: async ({ request }) => {
    const data = await request.formData();
    const start_date = data.get('start_date')?.toString();
    const end_date = data.get('end_date')?.toString();
    let recordData;
    try {
      if (start_date && end_date) {
        recordData = await db
          .select()
          .from(records)
          .where(sql`date_pickup BETWEEN ${start_date} AND ${end_date}`)
          .orderBy(desc(records.datePickup));
      }
      else {
        recordData = await db.select().from(records).orderBy(desc(records.datePickup));
      }
    } catch (error) {
      console.error("Database query error:", error);
      return { success: false, error: "Failed to retrieve data" };
    }
    return { success: true, data: recordData, start_date: start_date, end_date: end_date };
  },
  remark: async ({ request }) => {
    const data = await request.formData();
    const remark = data.get('remark')?.toString();

    let recordData;
    try {
      if (remark) {
        recordData = await db
          .select()
          .from(records)
          .where(sql`remarks = ${remark}`)
          .orderBy(desc(records.datePickup));
      }
      else {
        recordData = await db.select().from(records).orderBy(desc(records.datePickup));
      }
    }
    catch (error) {
      console.error("Database query error:", error);
      return { success: false, error: "Failed to retrieve data" };
    }
    return { success: true, data: recordData, remark };
  },
  delete: async ({ request }) => {
    const data = await request.formData();
    const caseNoToDelete = data.get("case_delete")?.toString();

    if (!caseNoToDelete) {
      return { success: false, error: "Case number for deletion is required" };
    }
    try {
      await db.transaction(async tx => {
        // Use eq for a more type-safe comparison.
        await tx.delete(records).where(eq(records.caseNo, caseNoToDelete));
        await tx.delete(history).where(eq(history.historyId, caseNoToDelete));
      });
      return { success: true }; // Indicate success
    } catch (error) {
      console.error('Error deleting record:', error);
      return { success: false, error: 'Failed to delete record data' }; // Provide error details
    }
  }
};
