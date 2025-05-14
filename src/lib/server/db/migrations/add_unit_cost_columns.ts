import { sql } from 'drizzle-orm';

export async function up(db: any) {
  await db.execute(sql`
        ALTER TABLE records
        ADD COLUMN IF NOT EXISTS upper_unit INTEGER,
        ADD COLUMN IF NOT EXISTS lower_unit INTEGER,
        ADD COLUMN IF NOT EXISTS upper_cost INTEGER,
        ADD COLUMN IF NOT EXISTS lower_cost INTEGER;
    `);
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