import { sql } from 'drizzle-orm';

export async function up(db: any) {

}

export async function down(db: any) {
  await db.execute(sql`
        ALTER TABLE records
        DROP COLUMN IF EXISTS upper_unit,
        DROP COLUMN IF EXISTS lower_unit,
        DROP COLUMN IF EXISTS upper_cost,
        DROP COLUMN IF EXISTS lower_cost;
    `);
}