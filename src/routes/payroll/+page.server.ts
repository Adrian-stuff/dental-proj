import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
  payrollRunItems,
  payrollRuns,
  payrollSetItems,
  payrollSets,
  supply
} from '$lib/server/db/schema';
import { and, asc, desc, eq, inArray, ne, or, sql } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// numeric(10, 2)
const MAX_AMOUNT = 99_999_999.99;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type PayoutItem = { employeeName: string; amount: string };

const toCents = (amount: string | number) => Math.round(Number(amount) * 100);

/** Parses the JSON list of `{ employeeName, amount }` the page posts. Blank rows are ignored. */
function parseItems(raw: FormDataEntryValue | null): { items: PayoutItem[] } | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(raw ?? '[]'));
  } catch {
    return { error: 'Invalid employee list' };
  }
  if (!Array.isArray(parsed)) return { error: 'Invalid employee list' };

  const items: PayoutItem[] = [];
  const seen = new Set<string>();
  for (const entry of parsed) {
    const name = String(entry?.employeeName ?? '').trim();
    const rawAmount = entry?.amount;
    const isBlankAmount = rawAmount === null || rawAmount === undefined || rawAmount === '';
    if (!name && isBlankAmount) continue;

    if (!name) return { error: 'Every payout needs an employee name' };
    if (name.length > 255) return { error: `Employee name is too long: ${name.slice(0, 40)}…` };
    const amount = Number(rawAmount);
    if (isBlankAmount || !Number.isFinite(amount) || amount <= 0) {
      return { error: `Enter an amount greater than 0 for ${name}` };
    }
    if (amount > MAX_AMOUNT) return { error: `The amount for ${name} is too large` };

    const key = name.toLowerCase();
    if (seen.has(key)) return { error: `${name} is listed more than once` };
    seen.add(key);

    items.push({ employeeName: name, amount: (toCents(amount) / 100).toFixed(2) });
  }

  if (items.length === 0) return { error: 'Add at least one employee' };
  return { items };
}

function parseId(raw: FormDataEntryValue | null): number | null {
  const id = Number(String(raw ?? ''));
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseDate(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? '').trim();
  if (!DATE_RE.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? value : null;
}

export const load: PageServerLoad = async ({ url }) => {
  const searchParams = url.searchParams;
  const now = new Date();
  const selectedYear = parseInt(searchParams.get('year') || now.getFullYear().toString());
  const selectedMonth = parseInt(searchParams.get('month') || (now.getMonth() + 1).toString());

  const startDate = formatDate(new Date(selectedYear, selectedMonth - 1, 1));
  const endDate = formatDate(new Date(selectedYear, selectedMonth, 0));

  try {
    const [setRows, setItemRows, runRows] = await Promise.all([
      db.select().from(payrollSets).orderBy(asc(payrollSets.setName), asc(payrollSets.setId)),
      db
        .select()
        .from(payrollSetItems)
        .orderBy(asc(payrollSetItems.setId), asc(payrollSetItems.sortOrder), asc(payrollSetItems.itemId)),
      db
        .select()
        .from(payrollRuns)
        .where(sql`${payrollRuns.payDate} BETWEEN ${startDate} AND ${endDate}`)
        .orderBy(desc(payrollRuns.payDate), desc(payrollRuns.runId))
    ]);

    const runItemRows = runRows.length
      ? await db
          .select()
          .from(payrollRunItems)
          .where(
            inArray(
              payrollRunItems.runId,
              runRows.map((run) => run.runId)
            )
          )
          .orderBy(asc(payrollRunItems.runItemId))
      : [];

    const sets = setRows.map((set) => {
      const items = setItemRows
        .filter((item) => item.setId === set.setId)
        .map((item) => ({ employeeName: item.employeeName, amount: Number(item.amount) }));
      return {
        setId: set.setId,
        setName: set.setName,
        updatedAt: set.updatedAt,
        items,
        total: items.reduce((cents, item) => cents + toCents(item.amount), 0) / 100
      };
    });

    const runs = runRows.map((run) => {
      const items = runItemRows
        .filter((item) => item.runId === run.runId)
        .map((item) => ({
          employeeName: item.employeeName,
          amount: Number(item.amount),
          // false when the expense was deleted from the Expenses page afterwards
          hasExpense: item.supplyId !== null
        }));
      return {
        runId: run.runId,
        setId: run.setId,
        setName: run.setName,
        payDate: run.payDate,
        periodStart: run.periodStart,
        periodEnd: run.periodEnd,
        notes: run.notes,
        items,
        total: items.reduce((cents, item) => cents + toCents(item.amount), 0) / 100
      };
    });

    return {
      currentMonth: selectedMonth,
      currentYear: selectedYear,
      sets,
      runs,
      monthTotal: runs.reduce((cents, run) => cents + toCents(run.total), 0) / 100
    };
  } catch (e) {
    console.error('Error loading payroll:', e);
    return {
      currentMonth: selectedMonth,
      currentYear: selectedYear,
      sets: [],
      runs: [],
      monthTotal: 0,
      loadError: 'Failed to load payroll'
    };
  }
};

export const actions = {
  changeMonth: async ({ request }) => {
    const data = await request.formData();
    const month = data.get('month');
    const year = data.get('year');
    redirect(303, `?month=${month}&year=${year}`);
  },

  // Create a payout set, or replace an existing one's name and employees
  saveSet: async ({ request }) => {
    const data = await request.formData();
    const setId = data.get('set_id') ? parseId(data.get('set_id')) : null;
    if (data.get('set_id') && setId === null) {
      return fail(400, { action: 'saveSet', error: 'Invalid payout set' });
    }

    const setName = String(data.get('set_name') ?? '').trim();
    if (!setName) return fail(400, { action: 'saveSet', error: 'Give the payout set a name' });
    if (setName.length > 255) return fail(400, { action: 'saveSet', error: 'The set name is too long' });

    const parsed = parseItems(data.get('items'));
    if ('error' in parsed) return fail(400, { action: 'saveSet', error: parsed.error });

    try {
      const [sameName] = await db
        .select({ setId: payrollSets.setId })
        .from(payrollSets)
        .where(
          and(
            sql`lower(${payrollSets.setName}) = lower(${setName})`,
            setId ? ne(payrollSets.setId, setId) : undefined
          )
        )
        .limit(1);
      if (sameName) {
        return fail(400, { action: 'saveSet', error: `A payout set named "${setName}" already exists` });
      }

      const savedId = await db.transaction(async (tx) => {
        let id = setId;
        if (id) {
          const updated = await tx
            .update(payrollSets)
            .set({ setName, updatedAt: sql`CURRENT_TIMESTAMP` } as Partial<typeof payrollSets.$inferInsert>)
            .where(eq(payrollSets.setId, id))
            .returning({ setId: payrollSets.setId });
          if (updated.length === 0) return null;
          await tx.delete(payrollSetItems).where(eq(payrollSetItems.setId, id));
        } else {
          const [created] = await tx
            .insert(payrollSets)
            .values({ setName })
            .returning({ setId: payrollSets.setId });
          id = created.setId;
        }

        await tx.insert(payrollSetItems).values(
          parsed.items.map((item, index) => ({
            setId: id!,
            employeeName: item.employeeName,
            amount: item.amount,
            sortOrder: index
          }))
        );
        return id;
      });

      if (savedId === null) {
        return fail(404, { action: 'saveSet', error: 'That payout set no longer exists' });
      }
      return { action: 'saveSet', success: true, message: `Saved payout set "${setName}"`, setId: savedId };
    } catch (error) {
      console.error('Error saving payout set:', error);
      return fail(500, { action: 'saveSet', error: 'Failed to save the payout set' });
    }
  },

  deleteSet: async ({ request }) => {
    const data = await request.formData();
    const setId = parseId(data.get('set_id'));
    if (!setId) return fail(400, { action: 'deleteSet', error: 'Invalid payout set' });

    try {
      // Items cascade; past payroll runs keep their own copy of the name and payouts
      await db.delete(payrollSets).where(eq(payrollSets.setId, setId));
      return { action: 'deleteSet', success: true, message: 'Payout set deleted' };
    } catch (error) {
      console.error('Error deleting payout set:', error);
      return fail(500, { action: 'deleteSet', error: 'Failed to delete the payout set' });
    }
  },

  // Generate one payroll batch: a payroll run plus one expense per employee
  generate: async ({ request }) => {
    const data = await request.formData();

    const setId = data.get('set_id') ? parseId(data.get('set_id')) : null;
    if (data.get('set_id') && setId === null) {
      return fail(400, { action: 'generate', error: 'Invalid payout set' });
    }

    const payDate = parseDate(data.get('pay_date'));
    if (!payDate) return fail(400, { action: 'generate', error: 'Enter a valid pay date' });

    const rawStart = String(data.get('period_start') ?? '').trim();
    const rawEnd = String(data.get('period_end') ?? '').trim();
    const periodStart = rawStart ? parseDate(rawStart) : null;
    const periodEnd = rawEnd ? parseDate(rawEnd) : null;
    if ((rawStart && !periodStart) || (rawEnd && !periodEnd) || !periodStart !== !periodEnd) {
      return fail(400, { action: 'generate', error: 'Enter both period dates, or leave both empty' });
    }
    if (periodStart && periodEnd && periodStart > periodEnd) {
      return fail(400, { action: 'generate', error: 'The period cannot end before it starts' });
    }

    const notes = String(data.get('notes') ?? '').trim() || null;
    if (notes && notes.length > 1000) return fail(400, { action: 'generate', error: 'Notes are too long' });

    const parsed = parseItems(data.get('items'));
    if ('error' in parsed) return fail(400, { action: 'generate', error: parsed.error });

    const allowDuplicate = data.get('allow_duplicate') === 'true';

    try {
      let setName: string | null = null;
      if (setId) {
        const [set] = await db
          .select({ setName: payrollSets.setName })
          .from(payrollSets)
          .where(eq(payrollSets.setId, setId));
        if (!set) return fail(404, { action: 'generate', error: 'That payout set no longer exists' });
        setName = set.setName;

        // Guard against paying the same set twice for the same pay date or period
        if (!allowDuplicate) {
          const [existing] = await db
            .select({
              payDate: payrollRuns.payDate,
              periodStart: payrollRuns.periodStart,
              periodEnd: payrollRuns.periodEnd
            })
            .from(payrollRuns)
            .where(
              and(
                eq(payrollRuns.setId, setId),
                or(
                  eq(payrollRuns.payDate, payDate),
                  periodStart && periodEnd
                    ? sql`(${payrollRuns.periodStart} <= ${periodEnd} AND ${payrollRuns.periodEnd} >= ${periodStart})`
                    : undefined
                )
              )
            )
            .orderBy(desc(payrollRuns.payDate))
            .limit(1);

          if (existing) {
            const when =
              existing.periodStart && existing.periodEnd
                ? `for ${existing.periodStart} to ${existing.periodEnd} (paid ${existing.payDate})`
                : `paid on ${existing.payDate}`;
            return fail(409, {
              action: 'generate',
              duplicate: true,
              error: `"${setName}" already has a payroll ${when}.`
            });
          }
        }
      }

      const periodLabel = periodStart && periodEnd ? ` (${periodStart} to ${periodEnd})` : '';

      await db.transaction(async (tx) => {
        const [run] = await tx
          .insert(payrollRuns)
          .values({ setId, setName, payDate, periodStart, periodEnd, notes } as typeof payrollRuns.$inferInsert)
          .returning({ runId: payrollRuns.runId });

        // One row at a time so each payout is paired with the expense it created
        for (const item of parsed.items) {
          const [expense] = await tx
            .insert(supply)
            .values({
              supplyDate: payDate,
              supplyCost: item.amount,
              supplyDescription: `Payroll - ${item.employeeName}${periodLabel}`
            } as typeof supply.$inferInsert)
            .returning({ supplyId: supply.supplyId });

          await tx.insert(payrollRunItems).values({
            runId: run.runId,
            employeeName: item.employeeName,
            amount: item.amount,
            supplyId: expense.supplyId
          } as typeof payrollRunItems.$inferInsert);
        }
      });

      const total = parsed.items.reduce((cents, item) => cents + toCents(item.amount), 0) / 100;
      const [payYear, payMonth] = payDate.split('-').map(Number);
      return {
        action: 'generate',
        success: true,
        message: `Payroll generated: ${parsed.items.length} payout${parsed.items.length === 1 ? '' : 's'} totaling ₱${total.toFixed(2)}, added to expenses on ${payDate}`,
        payMonth,
        payYear
      };
    } catch (error) {
      console.error('Error generating payroll:', error);
      return fail(500, { action: 'generate', error: 'Failed to generate payroll' });
    }
  },

  // Delete a payroll run and the expenses it created
  deleteRun: async ({ request }) => {
    const data = await request.formData();
    const runId = parseId(data.get('run_id'));
    if (!runId) return fail(400, { action: 'deleteRun', error: 'Invalid payroll' });

    try {
      const deleted = await db.transaction(async (tx) => {
        const items = await tx
          .select({ supplyId: payrollRunItems.supplyId })
          .from(payrollRunItems)
          .where(eq(payrollRunItems.runId, runId));

        const removed = await tx
          .delete(payrollRuns)
          .where(eq(payrollRuns.runId, runId))
          .returning({ runId: payrollRuns.runId });
        if (removed.length === 0) return false;

        const supplyIds = items
          .map((item) => item.supplyId)
          .filter((id): id is number => id !== null);
        if (supplyIds.length > 0) {
          await tx.delete(supply).where(inArray(supply.supplyId, supplyIds));
        }
        return true;
      });

      if (!deleted) return fail(404, { action: 'deleteRun', error: 'That payroll no longer exists' });
      return { action: 'deleteRun', success: true, message: 'Payroll and its expenses deleted' };
    } catch (error) {
      console.error('Error deleting payroll:', error);
      return fail(500, { action: 'deleteRun', error: 'Failed to delete the payroll' });
    }
  }
} satisfies Actions;
