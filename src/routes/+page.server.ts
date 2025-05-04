import { db } from '$lib/server/db';
import { clinics, doctors, records } from '$lib/server/db/schema';
import { desc, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  return {
    data: await db.select().from(records).where(sql`clinic_name = 'St. Jude Clinic'`).orderBy(desc(records.recordId)),
    doctors: (await db.select()
      .from(doctors)
      .orderBy(desc(doctors.doctorName))
    ).map((doctor) => ({
      value: doctor.doctorName,
      label: doctor.doctorName
    })),

    clinics: (await db.select()
      .from(clinics)
      .orderBy(desc(clinics.clinicName))
    ).map((clinic) => ({
      value: clinic.clinicName,
      label: clinic.clinicName
    })),
  }
};


export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();

    const clinicName = data.get('clinic_name')?.toString();

    return { success: true, data: await db.select().from(records).where(sql` ${records.clinicName} = ${clinicName}`) };
  }
} satisfies Actions;
