import { getDb } from "../database";
import type { RecurringTransaction } from "../types";
import { createTransaction } from "./transactionService";

export async function getRecurringTransactions() {
  const db = await getDb();

  return await db.select<RecurringTransaction[]>(`
    SELECT
      recurring_transactions.*,
      accounts.name AS account_name
    FROM recurring_transactions
    LEFT JOIN accounts ON recurring_transactions.account_id = accounts.id
    ORDER BY next_due_date ASC
  `);
}

export async function createRecurringTransaction(
  accountId: number,
  merchant: string,
  category: string,
  amount: number,
  frequency: string,
  nextDueDate: string,
  notes: string,
  autopay: boolean,
  autoGenerate: boolean
) {
  const db = await getDb();

  await db.execute(
    `
    INSERT INTO recurring_transactions
    (
      account_id,
      merchant,
      category,
      amount,
      frequency,
      next_due_date,
      notes,
      autopay,
      auto_generate
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      accountId,
      merchant,
      category,
      amount,
      frequency,
      nextDueDate,
      notes,
      autopay ? 1 : 0,
      autoGenerate ? 1 : 0,
    ]
  );
}

export async function updateRecurringTransactionById(
  id: number,
  accountId: number,
  merchant: string,
  category: string,
  amount: number,
  frequency: string,
  nextDueDate: string,
  notes: string,
  autopay: boolean,
  autoGenerate: boolean
) {
  const db = await getDb();

  await db.execute(
    `
    UPDATE recurring_transactions
    SET account_id = $1,
        merchant = $2,
        category = $3,
        amount = $4,
        frequency = $5,
        next_due_date = $6,
        notes = $7,
        autopay = $8,
        auto_generate = $9
    WHERE id = $10
    `,
    [
      accountId,
      merchant,
      category,
      amount,
      frequency,
      nextDueDate,
      notes,
      autopay ? 1 : 0,
      autoGenerate ? 1 : 0,
      id,
    ]
  );
}

export async function deleteRecurringTransactionById(id: number) {
  const db = await getDb();

  await db.execute("DELETE FROM recurring_transactions WHERE id = $1", [id]);
}

function getNextDueDate(date: string, frequency: string) {
  const nextDate = new Date(date);

  if (frequency === "Weekly") {
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (frequency === "Biweekly") {
    nextDate.setDate(nextDate.getDate() + 14);
  } else if (frequency === "Yearly") {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  } else {
    nextDate.setMonth(nextDate.getMonth() + 1);
  }

  return nextDate.toISOString().slice(0, 10);
}

export async function generateDueTransactions(today: string) {
  const db = await getDb();

  const dueRecurring = await db.select<RecurringTransaction[]>(
    `
    SELECT *
    FROM recurring_transactions
    WHERE next_due_date <= $1
      AND auto_generate = 1
    `,
    [today]
  );

  for (const recurring of dueRecurring) {
    await createTransaction(
      recurring.account_id,
      recurring.next_due_date,
      recurring.merchant,
      recurring.category,
      recurring.amount,
      recurring.notes || "Generated from recurring transaction"
    );

    const nextDueDate = getNextDueDate(
      recurring.next_due_date,
      recurring.frequency
    );

    await db.execute(
      `
      UPDATE recurring_transactions
      SET next_due_date = $1
      WHERE id = $2
      `,
      [nextDueDate, recurring.id]
    );
  }
}